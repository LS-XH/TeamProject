# 课题搭子交付清单

日期：2026-11-08（北京时间）。本文件记录交付结果与不能由自动执行补齐的缺口。

## 入口

- 目标公开应用：[课题搭子](https://keti-dazi-lsxh.leoxinghen.chatgpt.site)。部署实际结果在下方发布回执追加，不能只凭预期URL判断成功。
- 目标博客页面：[项目博客](https://keti-dazi-lsxh.leoxinghen.chatgpt.site/blog)。
- 已推送的公开仓库：[LS-XH/TeamProject](https://github.com/LS-XH/TeamProject)。
- 初次CI验证：[GitHub Actions 42412419616](https://github.com/LS-XH/TeamProject/actions/runs/42412419616)，初次源码提交检查成功；最终提交状态另行核对。

## 文件交付

| 产物 | 路径 |
| --- | --- |
| 规划 | Planning.md |
| 软件源码、测试、运行方式 | src/、tests/、scripts/、README.md |
| 需求文档含前后端、类图、思维导图、验收 | docs/SRS.md |
| 真实材料调研与证据账本 | docs/research.md、docs/assignment.md |
| 团队展示与愿景 | docs/team.md |
| 完整博客Markdown | docs/blog.md |
| 六页可编辑PPT含演讲备注 | docs/presentation/课题搭子-选题答辩.pptx |
| 四分钟讲稿与三分钟问答 | docs/defense.md |
| 测试记录与截图 | docs/testing.md、docs/browser-results.json、docs/screenshots/ |

PPT经过包结构、字体、版面和重新导入验证，6页已逐页渲染查看。没有在原生PowerPoint内播放验证。PPT中团队名称标注为拟定，缺失的真实资料没有补造。

## 已核验与限制

- 25项Node领域和接口测试通过。
- 13组本地Edge浏览器检查通过，含390px布局与自动保存、导入导出。
- DeepSeek协议与错误处理使用模拟响应验证；**没有真实密钥，未验证真实模型调用与质量**。
- 需求引用校验不保证提取完整性；证据字段不保证交付真实性。
- 无实时多人协作、无硬件联动、无定时提醒；数据只存在当前浏览器，可备份交接。

## 仍需真实材料或外部操作的事项

| 项目 | 状态 | 为什么不能自动填造 |
| --- | --- | --- |
| 班级链接、原课程作业链接 | 未提供 | 无法从题面确定课程平台与班级 |
| 学号、姓名与成员风采 | 未提供 | GitHub账号不能推出身份和成员名单 |
| 首次真实团队合照 | 未提供 | 生成图片不能代替真实合照 |
| 用户访谈与可用性调研 | 未开展 | 不把资料分析伪装成采访或问卷 |
| 真实模型调用与效果评估 | 未验证 | 没有可用密钥；mock不是成功调用证据 |
| 课程平台作业提交 | 未执行 | 没有课程页面、班级与提交入口，GitHub推送不等于提交 |

博客具体截止为2026-11-08 23:59，答辩为2026-11-09。原说明一般性文字与这两个具体日期顺序存在冲突，保留具体日期，不自行更改。

## 发布回执

执行发布后追加实际平台状态、源码提交与公开访问检查结果。
