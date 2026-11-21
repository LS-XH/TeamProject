# 数据库设计说明书
海底小纵队 · 课题搭子 · DB-02 · 设计基线 1.0 · 2026-11-21

## 1 引言与引用
依据 GB/T 8567—2006《计算机软件文档编制规范》第7.14节，描述课题搭子共享版本的数据库选择、逻辑结构、对象映射、访问约束及维护策略。当前线上版使用浏览器本机存储，本说明的数据库尚未部署。

术语：ER 为实体联系，ORM 为对象关系映射，SQL 为结构化查询语言，PK 为主键，FK 为外键。ID 为标识符，JSON 为 JavaScript 对象表示法。P0、P1 为必做，P2 为可选。FR 为需求规格说明书的功能需求编号。

## 2 顶层决策和概念结构
采用 SQLite 兼容关系模式。原文版本以项目范围内的递增整数标识。生成新的需求版本时，旧版本保留且可回看。计划级查询使用项目标识与版本号，任务编号在版本内唯一。后台归档通过状态字段进行，归档保留项目及其历史。
@er.png

## 3 关系模式与数据字典
account(id PK, display_name, platform_role)；名称用于显示。平台角色 member 或 admin，授权来源由认证服务管理。
project(id PK, name, deadline, state, revision)；deadline 可空，按 YYYY-MM-DD 解释。state 为 active 或 archived。revision 为非负整数，用于乐观并发。
membership(project_id, account_id, role)；二列组成 PK，分别引用 project 和 account。角色取 owner、editor、viewer。创建项目时同一事务插入 owner。唯一索引限制每项目至多一个 owner，变更流程保证至少一个。
source_version(project_id, version, body)；前两列组成 PK。project_id 引用 project。正文1—18000字符，版本从1递增。同一项目最大版本为默认读取版本。
requirement(project_id, version, code, title, quote, acceptance, priority)；前三列组成 PK，前两列引用 source_version。quote 逐字引用，保存前对同版本正文校验。priority 取 P0、P1、P2。
task(project_id, version, code, requirement_code, title, assignee_id, due, status, evidence)；前三列组成 PK。需求引用包含项目、版本和需求编号，防止串项目和串版本。负责人引用同项目成员，可空。状态待开始、进行中、完成分别对应 todo、doing、done。evidence 可为空串，体检规则据此提示。
audit_event(id PK, project_id, actor_id, action, created_at)；项目及操作人分别引用 project 和 account。action 取 archive、restore。created_at 用协调世界时记录，界面按本地时区展示。

## 4 对象关系映射与访问责任
Account ↔ account，由账户仓储按主键读取。
Project ↔ project，由项目仓储管理状态与修订号。
Membership ↔ membership，以项目和账户组合键映射成员角色。
SourceVersion ↔ source_version，以项目和版本组合键定位原文。
Requirement ↔ requirement，将 quote、acceptance、priority 原样映射，不存重复覆盖率。
Task ↔ task，将 requirementId 映射至 requirement_code，将 owner 从显示名称转换为成员标识。导入不能确定唯一成员时置为空，提示人工分配。
AuditEvent ↔ audit_event，只追加成功归档和恢复事件。权限检查与写入仓储调用统一由应用服务发起。字段和索引以附带 schema.sql 为准。

## 5 事务、索引和维护
创建版本时，在单一事务中确认项目状态、成员身份和乐观锁，分配新版本并插入原文、需求及初始任务。失败回滚。编辑任务同时核验修订号，成功后更新项目修订号。归档与审计共同提交。删除成员之前，先清除其任务指派并校验项目仍有组长。

任务按项目、版本及需求编号索引，服务于覆盖率与漏项统计。项目与负责人索引用于分工筛选，审计使用项目和时间索引倒序读取。项目列表按稳定主键分页。应用在服务端验证日期合法性与引用语义，数据库负责关系完整性、枚举与基本长度。

旧备份先在内存验证结构，再由组长选择新建项目并作为版本1导入。负责人仅在同组有唯一名称匹配时转换。现有本机记录可导出留底。业务对象和备份禁止持久化智能体密钥。平台管理列表只查询项目名和状态等元数据。

维护目标为每日备份并保留七日，改表前输出额外快照。恢复演练在隔离环境检查表计数、外键、旧版本和归档状态。保留期与恢复时间在选定托管套餐后核实，通过实际演练再承诺。

## 6 数据需求追踪与验证
FR01—FR05 ↔ source_version、requirement。版本内逐字引用和唯一需求编号。
FR06—FR09 ↔ task、membership。跨项目任务或负责人关联必须被外键拒绝。
FR10—FR15 ↔ project、source_version。事务失败后旧版本仍可读，导入不携带密钥。
后台新增设计 ↔ project、audit_event。并发归档只产生一次有效状态迁移与日志，恢复同理。体检指标实时计算，不设置可能与任务状态失配的缓存字段。
