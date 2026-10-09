import {useEffect,useState} from 'react';
import type {PilotInfo,AgentMutation} from '../../shared/bridge';
import type {Result} from '../../shared/contracts';
export function AgentSettings({info,busy,run}:{info:PilotInfo;busy:boolean;run:(task:()=>Promise<Result<unknown>>,message?:string)=>Promise<boolean>}){
 const [id,setId]=useState('general');const chosen=info.snapshot.agents.find(a=>a.id===id)??info.snapshot.agents[0];
 const [name,setName]=useState(chosen.name),[color,setColor]=useState(chosen.color),[replacement,setReplacement]=useState('general');const [newName,setNewName]=useState(''),[newColor,setNewColor]=useState('#8AADD4');
 useEffect(()=>{setId(chosen.id);setName(chosen.name);setColor(chosen.color);},[chosen.id,chosen.name,chosen.color]);
 const change=(c:AgentMutation,message:string)=>run(()=>window.thoughtline.agentChange(c,info.snapshot.revision),message);
 return <section className="agent-settings">
  <p>夹子颜色和文字一起区分 Agent。这里只记录归属，不连接 Agent 账户。</p>
  <label>编辑标签<select value={chosen.id} disabled={busy} onChange={e=>setId(e.target.value)}>{info.snapshot.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
  <div className="agent-form"><label>名称<input maxLength={40} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><label>夹子颜色<input type="color" value={color} disabled={busy} onChange={e=>setColor(e.target.value)}/></label><button disabled={busy||!name.trim()} onClick={()=>void change({kind:'update',id:chosen.id,name,color},'标签已更新，念头归属保持不变。')}>保存标签</button></div>
  {chosen.id!=='general'&&<div className="agent-form migration"><label>移除前，将念头和草稿迁到<select value={replacement} disabled={busy} onChange={e=>setReplacement(e.target.value)}>{info.snapshot.agents.filter(a=>a.id!==chosen.id).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><button disabled={busy||replacement===chosen.id} onClick={()=>void change({kind:'remove',id:chosen.id,replacement},'标签已移除，全文已迁移。')}>移除并迁移</button></div>}
  <hr/><h2>新增 Agent</h2><div className="agent-form"><label>名称<input maxLength={40} value={newName} disabled={busy} onChange={e=>setNewName(e.target.value)}/></label><label>夹子颜色<input type="color" value={newColor} disabled={busy} onChange={e=>setNewColor(e.target.value)}/></label><button disabled={busy||!newName.trim()} onClick={async()=>{if(await change({kind:'add',name:newName,color:newColor},'新标签已添加。'))setNewName('');}}>添加标签</button></div>
 </section>;
}
