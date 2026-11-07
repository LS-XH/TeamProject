export const SAMPLE = `1. 智能体必须嵌入软件系统，可选择任意平台。
2. 应用必须上线运行，供老师、助教和同学检查。
3. 选题要来自真实调研的需求，真实、可用、有价值。
4. 答辩日期：2026-11-09；演讲4分钟，答辩3分钟。
5. 博客提交截止：2026-11-08 23:59。
6. 答辩内容包括团队展示、选题报告和需求分析。
7. 团队展示包括队名、项目规划、成员介绍和首次合照。
8. 团队愿景约100字。
9. 需求文档参考软件需求规格说明规范，详细描述前端与后端。
10. 需求文档包括迭代记录、项目标志、思维导图、类图、功能描述和验收标准。
11. 项目需要突出杀手级功能，解决真实用户需求。
12. 如与硬件联动可获得额外加分（可选）。`;

export function segments(text) {
  return text.split(/\r?\n|[；;]/u).map(s=>s.trim()).filter(Boolean);
}
export function extractRules(source) {
  const lines = segments(source);
  if (!lines.length || lines.length > 80) throw new Error('请输入1至80条要求；较长文档请先整理成条目。');
  return lines.map((quote, i)=>({id:`R${String(i+1).padStart(3,'0')}`,title:quote.replace(/^(?:[-*#]+\s*|\d+[.、．]\s*)/u,'').slice(0,100),quote,priority:/可选(?!择)|额外加分|加分项|可获得.{0,8}加分/.test(quote)?'P2':'P0',acceptance:`逐项核对原文「${quote.slice(0,160)}」，提供可检查的交付证据。`}));
}
export function validateRequirements(items, source) {
  if (!Array.isArray(items) || !items.length || items.length>80) throw new Error('智能体返回的需求数量无效。');
  return items.map((r,i)=>{
    if (!r || typeof r.quote!=='string' || !r.quote.trim() || !source.includes(r.quote)) throw new Error(`第${i+1}条需求缺少可定位的原文证据，已拒绝该结果。`);
    for (const k of ['title','acceptance']) if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>1200) throw new Error('智能体返回字段不完整或过长。');
    return {id:`R${String(i+1).padStart(3,'0')}`,title:r.title.trim(),quote:r.quote,priority:['P0','P1','P2'].includes(r.priority)?r.priority:'P1',acceptance:r.acceptance.trim()};
  });
}
export function createProject(source, requirements, meta={}, mode='rules') {
  return {version:1,name:meta.name||'我的课程项目',deadline:meta.deadline||'',members:meta.members||'待分配',source,mode,createdAt:new Date().toISOString(),requirements,tasks:requirements.map((r,i)=>({id:`T${String(i+1).padStart(3,'0')}`,requirementId:r.id,title:`交付：${r.title}`,owner:'待分配',due:meta.deadline||'',status:'todo',evidence:''}))};
}
export function audit(project) {
  const issues=[];
  const required=project.requirements.filter(r=>r.priority!=='P2');
  for(const r of project.requirements){
    const tasks=project.tasks.filter(t=>t.requirementId===r.id);
    if(!tasks.length) issues.push({level:r.priority==='P2'?'info':'error',id:r.id,text:'没有关联任务，存在漏交风险'});
    for(const t of tasks){
      if(!t.owner.trim()||t.owner==='待分配') issues.push({level:'warn',id:t.id,text:'尚未指定负责人'});
      if(t.status==='done'&&!t.evidence.trim()) issues.push({level:'error',id:t.id,text:'已完成但缺少交付证据'});
      if(project.deadline&&t.due&&t.due>project.deadline) issues.push({level:'error',id:t.id,text:'任务时间晚于项目截止日期'});
    }
  }
  for(const t of project.tasks) if(!project.requirements.some(r=>r.id===t.requirementId)) issues.push({level:'error',id:t.id,text:'关联的需求不存在'});
  const planned=required.filter(r=>project.tasks.some(t=>t.requirementId===r.id)).length;
  const delivered=required.filter(r=>{const ts=project.tasks.filter(t=>t.requirementId===r.id);return ts.length&&ts.every(t=>t.status==='done'&&t.evidence.trim())}).length;
  return {issues,total:required.length,planned,delivered,coverage:required.length?Math.round(planned/required.length*100):0,completion:required.length?Math.round(delivered/required.length*100):0};
}
export function diffSources(before,after){
  const a=segments(before),b=segments(after);
  return {added:b.filter(x=>!a.includes(x)),removed:a.filter(x=>!b.includes(x))};
}
export function validateProject(p){
  if(!p||p.version!==1||typeof p.source!=='string'||p.source.length>18000||!p.source.trim()||typeof p.name!=='string'||typeof p.deadline!=='string'||typeof p.members!=='string') throw new Error('不是有效的课题搭子备份。');
  if(!Array.isArray(p.tasks)||p.tasks.length>200||!Array.isArray(p.requirements)||!p.requirements.length||p.requirements.length>80) throw new Error('备份条目数量无效。');
  const ids=new Set();
  for(const r of p.requirements){
    if(!r||!/^R\d{3}$/.test(r.id)||ids.has(r.id)||typeof r.title!=='string'||typeof r.acceptance!=='string'||typeof r.quote!=='string'||!r.quote.trim()||!p.source.includes(r.quote)||!['P0','P1','P2'].includes(r.priority)) throw new Error('备份需求或原文引用无效。');
    ids.add(r.id);
  }
  const tids=new Set();
  for(const t of p.tasks){
    if(!t||typeof t.id!=='string'||tids.has(t.id)||!['todo','doing','done'].includes(t.status)||!ids.has(t.requirementId)||['title','owner','due','evidence'].some(k=>typeof t[k]!=='string')) throw new Error('备份任务字段或关联关系无效。');
    tids.add(t.id);
  }
  return p;
}
function cell(value){return String(value).replaceAll('|','\\|').replaceAll('\n','<br>');}
export function exportMarkdown(p){
  const a=audit(p);
  return `# ${p.name}\n\n生成模式：${p.mode==='ai'?'DeepSeek 智能体':'离线规则（非大模型）'}\n\n截止：${p.deadline||'未设置'}\n\n必做需求任务覆盖率：${a.coverage}%；有证据的完成率：${a.completion}%。完成状态由填写者声明，证据真实性需人工核验。\n\n## 需求与验收\n\n| ID | 需求 | 优先级 | 原文证据 | 验收标准 |\n|---|---|---|---|---|\n${p.requirements.map(r=>`| ${r.id} | ${cell(r.title)} | ${r.priority} | ${cell(r.quote)} | ${cell(r.acceptance)} |`).join('\n')}\n\n## 任务计划\n\n| ID | 需求 | 任务 | 负责人 | 截止 | 状态 | 交付证据 |\n|---|---|---|---|---|---|---|\n${p.tasks.map(t=>`| ${t.id} | ${t.requirementId} | ${cell(t.title)} | ${cell(t.owner)} | ${t.due} | ${t.status} | ${cell(t.evidence)} |`).join('\n')}\n\n## 风险检查\n\n${a.issues.map(i=>`- [${i.level}] ${i.id}：${i.text}`).join('\n')||'未发现规则可识别的问题；仍需人工审查。'}\n\n## 原始要求\n\n${p.source}\n`;
}
