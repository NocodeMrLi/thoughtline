// SPDX-License-Identifier: GPL-3.0-only
import {useEffect,useRef,useState} from 'react';
import type {PilotInfo,AgentMutation} from '../../shared/bridge';
import type {Result} from '../../shared/contracts';
import {findIdeas} from '../../shared/ideaCommands';
export function Manage({info}:{info:PilotInfo}){
 const [section,setSection]=useState<'ideas'|'agents'>('ideas');const [status,setStatus]=useState<'all'|'hanging'|'archived'>('all');const [query,setQuery]=useState('');const [agent,setAgent]=useState('all');const [page,setPage]=useState(0);const [selected,setSelected]=useState<string|null>(info.manageSelection);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [undo,setUndo]=useState<{id:string;status:'hanging'|'archived'}|null>(null);const search=useRef<HTMLInputElement>(null);
 useEffect(()=>{setSection('ideas');setStatus('all');setQuery('');setAgent('all');setPage(0);setSelected(info.manageSelection);setError('');setNotice('');search.current?.focus();},[info.manageSession]);
 useEffect(()=>setPage(0),[query,status,agent]);
 useEffect(()=>{if(agent!=='all'&&!info.snapshot.agents.some(a=>a.id===agent))setAgent('all');},[info.snapshot.revision]);
 const results=findIdeas(info.snapshot,{status,query,agentId:agent});const maxPage=Math.max(0,Math.ceil(results.length/50)-1);const shownPage=Math.min(page,maxPage);const rows=results.slice(shownPage*50,(shownPage+1)*50);const idea=results.find(i=>i.id===selected)??rows[0];
 const run=async(task:()=>Promise<Result<unknown>>,message='')=>{if(busy)return false;setBusy(true);setError('');setNotice('');try{const r=await task();if(!r.ok){setError(r.message);return false;}setNotice(message);return true;}catch{setError('操作未成功，请保留内容后重试。');return false;}finally{setBusy(false);}};
 const setIdeaStatus=async(id:string,next:'hanging'|'archived',allowUndo=true)=>{const old=info.snapshot.ideas.find(i=>i.id===id)?.status;if(await run(()=>window.thoughtline.setStatus(id,next,info.snapshot.revision),next==='archived'?'已收起，正文仍在。':'已重新挂上。')){setUndo(allowUndo&&(old==='hanging'||old==='archived')?{id,status:old}:null);}};
 return <main data-view="manage" className="manage" onKeyDown={e=>{if(e.key==='Escape'&&!e.nativeEvent.isComposing&&e.nativeEvent.keyCode!==229&&!busy){e.preventDefault();void window.thoughtline.closeManage();}}}>
  <header><div className="section-tabs"><button aria-pressed={section==='ideas'} onClick={()=>setSection('ideas')}>念头</button><button aria-pressed={section==='agents'} onClick={()=>setSection('agents')}>Thoughtline标签</button></div><button className="close" aria-label="关闭浏览" disabled={busy} onClick={()=>void window.thoughtline.closeManage()}>×</button></header>
  {section==='ideas'?<>
   <div className="search-row"><label htmlFor="idea-search">搜索全文</label><input id="idea-search" ref={search} value={query} placeholder="念头、项目或标签" onChange={e=>setQuery(e.target.value)}/><select aria-label="筛选标签" value={agent} onChange={e=>setAgent(e.target.value)}><option value="all">全部标签</option>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
   <nav className="status-tabs" aria-label="念头状态">{([['all','全部'],['hanging','挂着'],['archived','已收起']] as const).map(([v,label])=><button key={v} aria-pressed={status===v} onClick={()=>setStatus(v)}>{label}</button>)}<span>{results.length} 条</span></nav>
   <div className="manage-body"><div className="idea-list" aria-label="搜索结果">{rows.map(i=><button key={i.id} data-idea-id={i.id} aria-pressed={idea?.id===i.id} onClick={()=>setSelected(i.id)}><strong>{i.title}</strong><span>{info.snapshot.agents.find(a=>a.id===i.agentId)?.name} · {i.status==='hanging'?'挂着':'已收起'}</span></button>)}{!rows.length&&<p className="empty-list">没有匹配的念头。更换条件试试。</p>}</div>
    <section className="idea-detail" aria-label="念头全文">{idea?<><div className="detail-meta"><strong>{idea.title}</strong><span>{idea.project}</span></div><textarea data-full-text aria-label="完整正文，可手动选中复制" readOnly value={idea.text}/><div className="detail-actions"><button disabled={busy} onClick={()=>void run(()=>window.thoughtline.copy(idea.id),'已复制完整正文。')}>复制全文</button><button disabled={busy} onClick={()=>void run(()=>window.thoughtline.openEdit(idea.id))}>编辑</button><button disabled={busy} onClick={()=>void setIdeaStatus(idea.id,idea.status==='hanging'?'archived':'hanging')}>{idea.status==='hanging'?'收起':'重新挂上'}</button></div></>:<p className="empty-list">正文会显示在这里。原文和换行完整保留。</p>}</section>
   </div>
   {results.length>50&&<nav className="pagination" aria-label="分页"><button disabled={shownPage===0} onClick={()=>setPage(shownPage-1)}>上一页</button><span>{shownPage+1} / {maxPage+1} · 每页50条</span><button disabled={shownPage===maxPage} onClick={()=>setPage(shownPage+1)}>下一页</button></nav>}
  </>:<AgentSettings info={info} busy={busy} run={run}/>}
  <footer className="manage-message"><span role="status">{info.placementNotice||notice}</span>{undo&&section==='ideas'&&<button disabled={busy} onClick={()=>void setIdeaStatus(undo.id,undo.status,false)}>撤销上次收起 / 恢复</button>}<span className="error" role="alert">{error}</span></footer>
 </main>;
}
function AgentSettings({info,busy,run}:{info:PilotInfo;busy:boolean;run:(task:()=>Promise<Result<unknown>>,message?:string)=>Promise<boolean>}){
 const [id,setId]=useState('general');const chosen=info.snapshot.agents.find(a=>a.id===id)??info.snapshot.agents[0];
 const [name,setName]=useState(chosen.name),[color,setColor]=useState(chosen.color),[replacement,setReplacement]=useState('general');const [newName,setNewName]=useState(''),[newColor,setNewColor]=useState('#8AADD4');
 useEffect(()=>{setId(chosen.id);setName(chosen.name);setColor(chosen.color);},[chosen.id,chosen.name,chosen.color]);
 const change=(c:AgentMutation,message:string)=>run(()=>window.thoughtline.agentChange(c,info.snapshot.revision),message);
 return <section className="agent-settings">
  <p>用标签区分用途、角色或工具；夹子颜色和文字帮助辨认。</p>
  <label>编辑标签<select value={chosen.id} disabled={busy} onChange={e=>setId(e.target.value)}>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  <div className="agent-form"><label>名称<input maxLength={40} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><label>夹子颜色<input type="color" value={color} disabled={busy} onChange={e=>setColor(e.target.value)}/></label><button disabled={busy||!name.trim()} onClick={()=>void change({kind:'update',id:chosen.id,name,color},'标签已更新，念头归属保持不变。')}>保存标签</button></div>
  {chosen.id!=='general'&&<div className="agent-form migration"><label>移除前，将念头和草稿迁到<select value={replacement} disabled={busy} onChange={e=>setReplacement(e.target.value)}>{info.snapshot.agents.filter(a=>a.id!==chosen.id).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><button disabled={busy||replacement===chosen.id} onClick={()=>void change({kind:'remove',id:chosen.id,replacement},'标签已移除，全文已迁移。')}>移除并迁移</button></div>}
  <hr/><h2>新增标签</h2><div className="agent-form"><label>名称<input maxLength={40} value={newName} disabled={busy} onChange={e=>setNewName(e.target.value)}/></label><label>夹子颜色<input type="color" value={newColor} disabled={busy} onChange={e=>setNewColor(e.target.value)}/></label><button disabled={busy||!newName.trim()} onClick={async()=>{if(await change({kind:'add',name:newName,color:newColor},'新标签已添加。'))setNewName('');}}>添加标签</button></div>
 </section>;
}
