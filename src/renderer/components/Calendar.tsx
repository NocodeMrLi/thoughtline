import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Idea,Result} from '../../shared/contracts';
import {prepareLeave} from '../hooks/leaveGuards';
import {IdeaReader} from './IdeaReader';
import {AgentSettings} from './AgentSettings';
import {IconButton} from './ActionIcon';
import brandLogoUrl from '../../../assets/source/approved-TL-brand-logo.jpg?url';
import {calendarIndex,ideaDay} from '../../shared/ideaHistory';
type Level='month'|'year'|'day'|'monthIdeas'|'yearIdeas'|'trash'|'agents';
type Nav={level:Level;month:string;day:string;scroll:number;limit:number};
type MotionKind='month-to-year'|'year-to-month'|'month-to-day'|'day-to-month'|'card-to-reader'|'reader-to-card';
type MotionRect={left:number;top:number;width:number;height:number};
type MotionRequest={from:MotionRect;to:string;kind:MotionKind;visual:HTMLElement|null};
const rectOf=(element:Element|null):MotionRect|null=>{if(!element)return null;const r=element.getBoundingClientRect();return r.width&&r.height?{left:r.left,top:r.top,width:r.width,height:r.height}:null;};
const visibleRect=(element:Element,clip:Element|null):MotionRect|null=>{const r=rectOf(element),c=rectOf(clip);if(!r)return null;if(!c)return r;const left=Math.max(r.left,c.left),top=Math.max(r.top,c.top),right=Math.min(r.left+r.width,c.left+c.width),bottom=Math.min(r.top+r.height,c.top+c.height);return right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null;};
const within=(a:MotionRect,b:MotionRect)=>a.left<b.left+b.width&&a.left+a.width>b.left&&a.top<b.top+b.height&&a.top+a.height>b.top;
function motionVisual(from:HTMLElement,visible:MotionRect):HTMLElement|null{
 let visual:HTMLElement;
 if(from.classList.contains('calendar-paper-groups')){
  visual=document.createElement('div');visual.className='calendar-paper-groups';let papers=0;
  for(const node of from.querySelectorAll<HTMLElement>('.calendar-day-papers h2,.calendar-paper,.calendar-load-more,.empty-list')){
   const box=rectOf(node);if(!box||!within(box,visible)||node.classList.contains('calendar-paper')&&papers>=18)continue;
   if(node.classList.contains('calendar-paper'))papers++;
   const copy=node.cloneNode(true) as HTMLElement;
   Object.assign(copy.style,{position:'absolute',left:`${box.left-visible.left}px`,top:`${box.top-visible.top}px`,width:`${box.width}px`,height:`${box.height}px`,margin:'0'});
   if(node.tagName==='H2'){copy.style.fontSize='12px';copy.style.fontWeight='400';copy.style.color='var(--muted)';}
   visual.appendChild(copy);
  }
  Object.assign(visual.style,{position:'absolute',left:'0px',top:'0px',width:`${visible.width}px`,height:`${visible.height}px`,margin:'0'});
 }else{
  visual=from.cloneNode(true) as HTMLElement;
  const source=rectOf(from)!;
  Object.assign(visual.style,{position:'absolute',left:`${source.left-visible.left}px`,top:`${source.top-visible.top}px`,width:`${source.width}px`,height:`${source.height}px`,margin:'0'});
 }
 if(visual.querySelector('input,textarea,select'))return null;
 for(const node of [visual,...visual.querySelectorAll<HTMLElement>('*')]){for(const attr of [...node.attributes])if(attr.name==='id'||attr.name==='role'||attr.name==='tabindex'||attr.name.startsWith('aria-')||attr.name.startsWith('data-'))node.removeAttribute(attr.name);if(node instanceof HTMLButtonElement){node.disabled=true;node.tabIndex=-1;}}
 return visual;
}
const pad=(n:number)=>String(n).padStart(2,'0');
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const dayKey=ideaDay;
const shiftMonth=(month:string,n:number)=>{const [y,m]=month.split('-').map(Number),d=new Date(Date.UTC(y,m-1+n,1));return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`;};
export function Calendar({info}:{info:PilotInfo}){
 const [today,setToday]=useState(todayKey);
 const initial:Nav={level:'month',month:today.slice(0,7),day:today,scroll:0,limit:9};
 const [nav,setNav]=useState<Nav>(initial),[history,setHistory]=useState<Nav[]>([]),[selected,setSelected]=useState<string|null>(null),[query,setQuery]=useState(''),[status,setStatus]=useState<'all'|'hanging'|'archived'>('all'),[tools,setTools]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const host=useRef<HTMLElement>(null),scroll=useRef<HTMLDivElement>(null),restoreScroll=useRef(0),readerScroll=useRef(0);
 const motionRequest=useRef<MotionRequest|null>(null),motionCleanup=useRef<(()=>void)|null>(null),navigationIntent=useRef(0),activeSession=useRef(info.manageSession),mounted=useRef(true);
 activeSession.current=info.manageSession;
 const cancelMotion=()=>{motionCleanup.current?.();motionCleanup.current=null;motionRequest.current=null;};
 const captureMotion=(from:Element|null,to:string,kind:MotionKind)=>{cancelMotion();const rect=from?(from.classList.contains('calendar-paper-groups')||from.classList.contains('month-grid')||from.classList.contains('year-grid')?visibleRect(from,scroll.current):rectOf(from)):null;if(rect)motionRequest.current={from:rect,to,kind,visual:from instanceof HTMLElement&&!from.classList.contains('idea-reader')?motionVisual(from,rect):null};};
 const currentIntent=(session:number,intent:number)=>mounted.current&&activeSession.current===session&&navigationIntent.current===intent;
 useEffect(()=>{navigationIntent.current++;restoreScroll.current=0;readerScroll.current=0;setNav(initial);setHistory([]);setSelected(null);setQuery('');setStatus('all');setTools(false);setBusy(false);setError('');},[info.manageSession]);
 useEffect(()=>()=>{mounted.current=false;navigationIntent.current++;cancelMotion();},[]);
 useEffect(()=>{const check=()=>setToday(todayKey());const timer=setInterval(check,60000);window.addEventListener('focus',check);return()=>{clearInterval(timer);window.removeEventListener('focus',check);};},[]);
 useLayoutEffect(()=>{if(!selected&&scroll.current)scroll.current.scrollTop=restoreScroll.current;},[nav,selected]);
 useLayoutEffect(()=>{
  const request=motionRequest.current;motionRequest.current=null;
  const root=host.current,target=request&&root?.querySelector<HTMLElement>(request.to);
  if(!request||!root||!target||info.snapshot.settings.reducedMotion||document.documentElement.dataset.motion==='reduce'||window.matchMedia('(prefers-reduced-motion: reduce)').matches||window.matchMedia('(forced-colors: active)').matches)return;
  const to=(target.classList.contains('calendar-paper-groups')||target.classList.contains('month-grid')||target.classList.contains('year-grid')?visibleRect(target,scroll.current):rectOf(target));
  if(!to)return;
  const bounds=root.getBoundingClientRect(),from=request.from;
  const layer=document.createElement('div');layer.className='calendar-motion-surface';layer.dataset.calendarMotion=request.kind;layer.dataset.from=JSON.stringify(from);layer.dataset.to=JSON.stringify(to);layer.setAttribute('aria-hidden','true');layer.inert=true;
  Object.assign(layer.style,{left:`${from.left-bounds.left}px`,top:`${from.top-bounds.top}px`,width:`${from.width}px`,height:`${from.height}px`});if(request.visual)layer.appendChild(request.visual);root.appendChild(layer);
  const duration=request.kind==='day-to-month'||request.kind==='month-to-year'||request.kind==='reader-to-card'?210:230;
  const expands=request.kind==='year-to-month'||request.kind==='month-to-day'||request.kind==='card-to-reader';
  // Fit the content uniformly inside the destination; the clipped surface keeps
  // text, A4 paper and brand pixels in their original proportions.
  const shrink=Math.min(to.width/from.width,to.height/from.height),grow=Math.min(from.width/to.width,from.height/to.height);
  const end=`translate(${to.left-from.left+(to.width-from.width*shrink)/2}px, ${to.top-from.top+(to.height-from.height*shrink)/2}px) scale(${shrink})`;
  const start=`translate(${from.left-to.left+(from.width-to.width*grow)/2}px, ${from.top-to.top+(from.height-to.height*grow)/2}px) scale(${grow})`;
  const surface=layer.animate(expands?[{opacity:1},{offset:.4,opacity:0},{opacity:0}]:[{transform:'translate(0px, 0px) scale(1, 1)',opacity:1},{transform:end,opacity:0}],{duration,easing:'cubic-bezier(.22, 1, .36, 1)',fill:'both'});
  const reveal=target.animate(expands?[{transform:start,transformOrigin:'0 0',opacity:.25},{transform:'none',transformOrigin:'0 0',opacity:1}]:[{opacity:.45},{opacity:1}],{duration:expands?duration:duration-35,delay:expands?0:35,easing:'cubic-bezier(.22, 1, .36, 1)',fill:'both'});
  let active=true;
  const scrollNode=scroll.current,anchorScroll=scrollNode?.scrollTop;
  const interruptScroll=()=>{if(scrollNode&&Math.abs(scrollNode.scrollTop-(anchorScroll??0))>.5)cancelMotion();};
  const interruptResize=()=>cancelMotion();
  const cleanup=()=>{if(!active)return;active=false;scrollNode?.removeEventListener('scroll',interruptScroll);window.removeEventListener('resize',interruptResize);surface.cancel();reveal.cancel();layer.remove();if(motionCleanup.current===cleanup)motionCleanup.current=null;};
  scrollNode?.addEventListener('scroll',interruptScroll,{passive:true});window.addEventListener('resize',interruptResize);
  motionCleanup.current=cleanup;surface.onfinish=cleanup;
 },[nav,selected,info.snapshot.settings.reducedMotion]);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'),contrast=window.matchMedia('(forced-colors: active)');const check=()=>{if(info.snapshot.settings.reducedMotion||media.matches||contrast.matches||document.documentElement.dataset.motion==='reduce')cancelMotion();};check();media.addEventListener('change',check);contrast.addEventListener('change',check);return()=>{media.removeEventListener('change',check);contrast.removeEventListener('change',check);cancelMotion();};},[info.manageSession,info.snapshot.settings.reducedMotion]);
 const names=useMemo(()=>new Map(info.snapshot.agents.map(a=>[a.id,a.name])),[info.snapshot.agents]);
 const index=useMemo(()=>{
  const normal=calendarIndex(info.snapshot,{query,status});
  const needle=query.trim().toLocaleLowerCase();
  const trash=info.snapshot.ideas.filter(i=>i.status==='deleted'&&(!needle||[i.text,i.title,i.project,names.get(i.agentId)??''].join('\n').toLocaleLowerCase().includes(needle))).sort((a,b)=>(b.deletedAt??'').localeCompare(a.deletedAt??''));
  return {normal,trash,days:[...normal.keys()]};
 },[info.snapshot,query,status,names]);
 const year=nav.month.slice(0,4),monthCount=(m:string)=>index.days.filter(d=>d.startsWith(m)).reduce((n,d)=>n+index.normal.get(d)!.length,0),yearCount=(y:string)=>index.days.filter(d=>d.startsWith(y+'-')).reduce((n,d)=>n+index.normal.get(d)!.length,0);
 const filteredDays=index.days.filter(d=>query.trim()?true:nav.level==='yearIdeas'?d.startsWith(year+'-'):nav.level==='day'?d===nav.day:d.startsWith(nav.month));
 const cards=nav.level==='trash'?index.trash:filteredDays.flatMap(d=>index.normal.get(d)!);
 const shown=cards.slice(0,nav.limit),idea=info.snapshot.ideas.find(i=>i.id===selected);
 // Recover the current selection from a committed snapshot, even when its Reader
 // has already unmounted. Navigation/session changes cancel this ownership.
 const priorReader=useRef<{session:number;intent:number;id:string|null;deleted:boolean;ids:string[]}|null>(null);
 useLayoutEffect(()=>{
  const prior=priorReader.current;
  if(prior&&prior.session===info.manageSession&&prior.intent===navigationIntent.current&&prior.id===selected&&selected&&(!idea||(idea.status==='deleted')!==prior.deleted)){
   const at=prior.ids.indexOf(selected),available=new Set(cards.map(i=>i.id));
   const next=[...prior.ids.slice(at+1),...prior.ids.slice(0,at).reverse()].find(id=>available.has(id));
   setSelected(next??null);restoreScroll.current=readerScroll.current;
  }
  priorReader.current={session:info.manageSession,intent:navigationIntent.current,id:selected,deleted:idea?.status==='deleted',ids:cards.map(i=>i.id)};
 },[info.snapshot,info.manageSession,selected]);
 const saveScroll=()=>({...nav,scroll:scroll.current?.scrollTop??0});
 const go=async(next:Nav,motion?:{from:Element|null;to:string;kind:MotionKind})=>{const intent=++navigationIntent.current,session=info.manageSession;if(!await prepareLeave()||!currentIntent(session,intent))return;if(motion)captureMotion(motion.from,motion.to,motion.kind);else cancelMotion();setHistory(h=>[...h,saveScroll()]);restoreScroll.current=next.scroll;setNav(next);setSelected(null);setTools(false);};
 const back=async()=>{const intent=++navigationIntent.current,session=info.manageSession;if(!await prepareLeave()||!currentIntent(session,intent))return;if(selected){captureMotion(host.current?.querySelector('.idea-reader')??null,`[data-idea-id="${selected}"]`,'reader-to-card');setSelected(null);restoreScroll.current=readerScroll.current;return;}const last=history.at(-1);if(last){if(nav.level==='day'&&last.level==='month')captureMotion(host.current?.querySelector('.calendar-paper-groups')??null,`[data-day="${nav.day}"]`,'day-to-month');else if(nav.level==='month'&&last.level==='year')captureMotion(host.current?.querySelector('.month-grid')??null,`[data-month="${nav.month}"]`,'month-to-year');else if(nav.level==='year'&&last.level==='month')captureMotion(host.current?.querySelector(`[data-month="${last.month}"]`)??null,'.month-grid','year-to-month');else cancelMotion();setHistory(h=>h.slice(0,-1));restoreScroll.current=last.scroll;setNav(last);}else{cancelMotion();restoreScroll.current=0;setNav(initial);}setTools(false);};
 const openIdea=async(id:string,from:Element)=>{const intent=++navigationIntent.current,session=info.manageSession,at=scroll.current?.scrollTop??0;if(!await prepareLeave()||!currentIntent(session,intent))return;captureMotion(from,'.idea-reader','card-to-reader');readerScroll.current=at;setSelected(id);setTools(false);};
 const run=async(task:()=>Promise<Result<unknown>>,message='')=>{if(busy)return false;const session=info.manageSession;setBusy(true);setError('');try{if(!await prepareLeave()||!mounted.current||activeSession.current!==session)return false;const r=await task();if(!mounted.current||activeSession.current!==session)return false;if(!r.ok){setError(r.message);return false;}setNotice(message);return true;}catch{if(mounted.current&&activeSession.current===session)setError('操作未成功，内容已保留。');return false;}finally{if(mounted.current&&activeSession.current===session)setBusy(false);}};
 const label=nav.level==='year'?`${year}年`:nav.level==='day'?`${nav.day} 的念头`:nav.level==='monthIdeas'?`${nav.month} 的全部念头`:nav.level==='yearIdeas'?`${year}年的全部念头`:nav.level==='trash'?'最近删除':nav.level==='agents'?'Agent 标签':`${year}年${Number(nav.month.slice(5))}月`;
 const grid=nav.level==='month'&&!query.trim(),yearGrid=nav.level==='year'&&!query.trim();
 const monthDays=new Date(Date.UTC(Number(year),Number(nav.month.slice(5)),0)).getUTCDate(),offset=new Date(nav.month+'-01T12:00:00Z').getUTCDay();
 return <main ref={host} data-view="manage" data-mode="calendar" data-material={info.manageMaterial} data-platform={info.platform} className="manage thought-calendar">
  <header className="auxiliary-header"><div className="calendar-heading">{(selected||history.length>0||nav.level!=='month')&&<IconButton icon="back" label="返回" onClick={()=>void back()}/>}<button className="calendar-title" onClick={()=>{if(nav.level==='month'&&!selected){void go({...nav,level:'year',scroll:0,limit:9},{from:host.current?.querySelector('.month-grid')??null,to:`[data-month="${nav.month}"]`,kind:'month-to-year'});}}} title={nav.level==='month'?'查看全年十二个月':undefined}>{idea?.title??label}</button></div><div className="calendar-header-actions"><IconButton icon="more" label="日历更多选项" aria-expanded={tools} onClick={()=>setTools(!tools)}/><button className="close" aria-label="关闭日历" onClick={()=>void window.thoughtline.closeManage()}>×</button></div></header>
  {tools&&<div className="calendar-tools"><button onClick={()=>void go({...nav,level:'trash',scroll:0,limit:9})}>最近删除</button><button onClick={()=>void run(()=>window.thoughtline.openSettings())}>存储与设置</button><button onClick={()=>void go({...nav,level:'agents',scroll:0,limit:9})}>Agent 标签</button></div>}
  {idea?<IdeaReader key={idea.id+':'+info.manageSession} idea={idea} info={info}/>:<>
   {nav.level!=='agents'&&<div className="calendar-search"><input aria-label="搜索念头" placeholder="搜索正文、名称或项目" value={query} onChange={e=>{navigationIntent.current++;cancelMotion();setQuery(e.target.value);restoreScroll.current=0;if(scroll.current)scroll.current.scrollTop=0;setNav(n=>({...n,scroll:0,limit:9}));}}/><select aria-label="筛选念头状态" value={status} onChange={e=>{navigationIntent.current++;cancelMotion();setStatus(e.target.value as typeof status);restoreScroll.current=0;if(scroll.current)scroll.current.scrollTop=0;setNav(n=>({...n,scroll:0,limit:9}));}}><option value="all">全部状态</option><option value="hanging">挂着</option><option value="archived">已收起</option></select></div>}
   {(grid||yearGrid)&&<div className="calendar-navigation"><button aria-label={yearGrid?'上一年':'上个月'} onClick={()=>{navigationIntent.current++;cancelMotion();restoreScroll.current=0;setNav(n=>({...n,month:shiftMonth(n.month,yearGrid?-12:-1)}));}}>‹</button><button onClick={()=>{navigationIntent.current++;cancelMotion();restoreScroll.current=0;setNav(initial);}}>今天</button><button onClick={()=>void go({...nav,level:yearGrid?'yearIdeas':'monthIdeas',scroll:0,limit:9})}>{yearGrid?`查看全年念头（${yearCount(year)}）`:`查看本月念头（${monthCount(nav.month)}）`}</button><button aria-label={yearGrid?'下一年':'下个月'} onClick={()=>{navigationIntent.current++;cancelMotion();restoreScroll.current=0;setNav(n=>({...n,month:shiftMonth(n.month,yearGrid?12:1)}));}}>›</button></div>}
   <div ref={scroll} className="calendar-content" data-calendar-scroll>
    {grid?<div className="month-grid" aria-label={`${nav.month}月历`}>{['日','一','二','三','四','五','六'].map(d=><span className="weekday" key={d}>{d}</span>)}{Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:monthDays},(_,i)=>{const day=nav.month+'-'+pad(i+1),count=index.normal.get(day)?.length??0;return <button key={day} className="date-cell" data-day={day} aria-current={day===today?'date':undefined} aria-label={`${day}，${count}条念头`} onClick={e=>void go({...nav,level:'day',day,scroll:0,limit:9},{from:e.currentTarget,to:'.calendar-paper-groups',kind:'month-to-day'})}><span>{i+1}</span>{count>0&&<span className="day-count"><MiniClip/>{count}</span>}</button>;})}</div>:yearGrid?<div className="year-grid" aria-label={`${year}十二个月`}>{Array.from({length:12},(_,i)=>{const month=year+'-'+pad(i+1),count=monthCount(month);return <button key={month} data-month={month} onClick={e=>void go({...nav,level:'month',month,scroll:0,limit:9},{from:e.currentTarget,to:'.month-grid',kind:'year-to-month'})}><strong>{i+1}月</strong><span>{count>0&&<MiniClip/>}{count}条</span></button>;})}</div>:nav.level==='agents'?<AgentSettings info={info} busy={busy} run={run}/>:<div className="calendar-paper-groups">
     {shown.length===0&&<p className="empty-list">{nav.level==='trash'?'最近删除为空，不会自动清空。':'这里还没有念头。'}</p>}
     {[...new Set(shown.map(dayKey))].map(day=><section key={day} className="calendar-day-papers"><h2>{day}</h2><div className="paper-grid">{shown.filter(i=>dayKey(i)===day).map(i=><button className="calendar-paper" data-idea-id={i.id} key={i.id} onClick={e=>void openIdea(i.id,e.currentTarget)}><MiniClip/><strong>{i.title}</strong><span className="calendar-paper-text">{i.text}</span><small>{names.get(i.agentId)}{i.project?' · '+i.project:''}{i.status==='archived'?' · 已收起':''}</small></button>)}</div></section>)}
     {shown.length<cards.length&&<button className="calendar-load-more" onClick={()=>{navigationIntent.current++;cancelMotion();restoreScroll.current=scroll.current?.scrollTop??0;setNav(n=>({...n,limit:n.limit+18}));}}>显示更多（还有{cards.length-shown.length}张）</button>}
    </div>}
   </div>
  </>}
  <footer className="calendar-footer"><span role="status">{info.placementNotice||notice}</span>{error&&<span className="error" role="alert">{error}</span>}</footer>
 </main>;
}
function MiniClip(){return <span className="mini-clip" aria-hidden="true"><svg viewBox="120 260 260 200" focusable="false"><image href={brandLogoUrl} width="1254" height="1254"/></svg></span>;}
