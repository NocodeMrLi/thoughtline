import {useEffect,useLayoutEffect,useRef,useState} from 'react';import {createRoot} from 'react-dom/client';
import type {PilotInfo} from '../shared/bridge';import type {Draft} from '../shared/contracts';
import {ropeY} from '../shared/ropeGeometry';import {shouldSubmit} from '../shared/composerKeys';
import './styles/overlay.css';
const blank:Draft={text:'',title:'',project:'',agentId:'general'};
function useInfo(){
 const [info,setInfo]=useState<PilotInfo|null>(null);
 useEffect(()=>{const off=window.thoughtline.onInfo(setInfo);window.thoughtline.info().then(setInfo).catch(console.error);return off;},[]);
 useEffect(()=>{if(info)document.documentElement.dataset.theme=info.dark?'dark':'light';},[info?.dark]);
 return info;
}
function Shelf({info}:{info:PilotInfo}){
 const root=useRef<HTMLDivElement>(null);const layoutRevision=useRef(0);const [copied,setCopied]=useState<string|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const samples=['codex','claude','general'].map((agentId,i)=>({id:'pilot-'+i,agentId,title:'窗口能力小样 '+(i+1),text:'测试透明展示、复制与焦点。\n这些假卡不会写入数据。'}));
 const items=info.snapshot.ideas.filter(x=>x.status==='hanging').slice(0,3);
 const visible=items.length?items:samples;
 useLayoutEffect(()=>{
  const publish=()=>{
   const rects=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-hit]')??[]).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
   window.thoughtline.hitRects({displayId:info.displayId,layoutRevision:++layoutRevision.current,rects});
  };
  publish();const observer=new ResizeObserver(publish);if(root.current)observer.observe(root.current);
  return()=>observer.disconnect();
 },[info.width,info.displayId,info.snapshot.revision]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const count=items.length||3;const sag=Math.min(88,8+6*count);
 return <div ref={root} data-view="shelf" className="shelf-root">
  <svg className="rope" width="100%" height="140" aria-hidden="true"><path d={`M 0 10 Q ${info.width/2} ${10+2*sag} ${info.width} 10`} /></svg>
  {visible.map((idea,index)=>{
   const x=info.width*(index+1)/(visible.length+1);const y=ropeY(x,info.width,count);
   const agent=info.snapshot.agents.find(x=>x.id===idea.agentId);
   return <div className="hanging" key={idea.id} style={{left:x,top:y}}>
    <div className="peg" style={{backgroundColor:agent?.color}} aria-hidden="true" />
    <button data-hit className="idea-card" aria-label={`${agent?.name??'通用'}：${idea.title}，点击复制正文`} onClick={async()=>{
      const result=await window.thoughtline.copy(idea.id);setCopied(result.ok?idea.id:'error');
      if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(null),1500);
    }}>
     <span className="agent-name">{agent?.name??'通用'}</span><strong>{idea.title}</strong><span className="preview">{idea.text}</span>
     <span className="copy-status" aria-live="polite">{copied===idea.id?'已复制':copied==='error'?'复制未成功':'点击复制全文'}</span>
    </button>
   </div>;
  })}
 </div>;
}
function Composer({info}:{info:PilotInfo}){
 const [draft,setDraft]=useState<Draft>(info.snapshot.draft??blank);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const text=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{setDraft(info.snapshot.draft??blank);setError('');text.current?.focus();},[info.composerSession]);
 const submit=async()=>{if(busy)return;setBusy(true);setError('');try{const result=await window.thoughtline.submit(draft,info.snapshot.revision);if(!result.ok)setError(result.message);}catch{setError('未能保存，请保留正文并重试。');}finally{setBusy(false);}};
 const close=async()=>{if(busy)return;setBusy(true);try{const result=await window.thoughtline.close(draft);if(!result.ok)setError(result.message);}catch{setError('草稿保存未成功，文字已保留。');}finally{setBusy(false);}};
 return <main data-view="composer" className="composer" onKeyDown={e=>{
  if(shouldSubmit({platform:info.platform,key:e.key,metaKey:e.metaKey,ctrlKey:e.ctrlKey,isComposing:e.nativeEvent.isComposing,keyCode:e.nativeEvent.keyCode})){e.preventDefault();void submit();}
  else if(e.key==='Escape'&&!e.nativeEvent.isComposing){e.preventDefault();void close();}
 }}>
  <header><label htmlFor="idea-text">念头</label><button className="close" aria-label="保存草稿并关闭" onClick={()=>void close()} disabled={busy}>×</button></header>
  <textarea id="idea-text" ref={text} value={draft.text} placeholder="写下来，稍后交给 Agent。" onChange={e=>setDraft({...draft,text:e.target.value})} spellCheck={false}/>
  <div className="agents" role="group" aria-label="给哪个Agent">{info.snapshot.agents.map(a=><button key={a.id} aria-pressed={draft.agentId===a.id} onClick={()=>setDraft({...draft,agentId:a.id})}>{a.name}</button>)}</div>
  <details><summary>项目 / 短标题（可选）</summary><div className="optional"><label>项目<input maxLength={40} value={draft.project} onChange={e=>setDraft({...draft,project:e.target.value})}/></label><label>短标题<input maxLength={50} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label></div></details>
  <p className="error" role="alert">{error}</p>
  <footer><span>{info.platform==='mac'?'⌘ Enter':'Ctrl Enter'} 挂上 · Enter换行 · Esc存草稿</span><button className="primary" disabled={busy||!draft.text.trim()} onClick={()=>void submit()}>{busy?'正在保存…':'挂上'}</button></footer>
 </main>;
}
function App(){const info=useInfo();if(!info)return null;return new URLSearchParams(location.search).get('view')==='composer'?<Composer info={info}/>:<Shelf info={info}/>;}
createRoot(document.getElementById('root')!).render(<App/>);
