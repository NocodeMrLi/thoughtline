import {useEffect,useMemo,useRef,useState} from 'react';
import type {PilotInfo} from '../../shared/bridge';
import type {Idea,Result} from '../../shared/contracts';
import {prepareLeave} from '../hooks/leaveGuards';
import {IdeaReader} from './IdeaReader';
import {AgentSettings} from './AgentSettings';
import {IconButton} from './ActionIcon';
import {Clothespin} from './Clothespin';
import {calendarIndex,ideaDay} from '../../shared/ideaHistory';
type Level='month'|'year'|'day'|'monthIdeas'|'yearIdeas'|'trash'|'agents';
type Nav={level:Level;month:string;day:string;scroll:number;limit:number};
const pad=(n:number)=>String(n).padStart(2,'0');
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const dayKey=ideaDay;
const shiftMonth=(month:string,n:number)=>{const [y,m]=month.split('-').map(Number),d=new Date(Date.UTC(y,m-1+n,1));return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`;};
export function Calendar({info}:{info:PilotInfo}){
 const [today,setToday]=useState(todayKey);
 const initial:Nav={level:'month',month:today.slice(0,7),day:today,scroll:0,limit:9};
 const [nav,setNav]=useState<Nav>(initial),[history,setHistory]=useState<Nav[]>([]),[selected,setSelected]=useState<string|null>(null),[query,setQuery]=useState(''),[status,setStatus]=useState<'all'|'hanging'|'archived'>('all'),[tools,setTools]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [origin,setOrigin]=useState<{x:number;y:number}|null>(null);
 const scroll=useRef<HTMLDivElement>(null),restoreScroll=useRef(0),readerScroll=useRef(0);
 useEffect(()=>{setNav(initial);setHistory([]);setSelected(null);setQuery('');setStatus('all');setError('');},[info.manageSession]);
 useEffect(()=>{const check=()=>setToday(todayKey());const timer=setInterval(check,60000);window.addEventListener('focus',check);return()=>{clearInterval(timer);window.removeEventListener('focus',check);};},[]);
 useEffect(()=>{if(!selected&&scroll.current)scroll.current.scrollTop=restoreScroll.current;},[nav,selected]);
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
 const saveScroll=()=>({...nav,scroll:scroll.current?.scrollTop??0});
 const go=async(next:Nav)=>{if(!await prepareLeave())return;setHistory(h=>[...h,saveScroll()]);restoreScroll.current=next.scroll;setNav(next);setSelected(null);setTools(false);};
 const back=async()=>{if(!await prepareLeave())return;if(selected){setSelected(null);restoreScroll.current=readerScroll.current;return;}const last=history.at(-1);if(last){setHistory(h=>h.slice(0,-1));restoreScroll.current=last.scroll;setNav(last);}else{restoreScroll.current=0;setNav(initial);}setTools(false);};
 const openIdea=async(id:string)=>{const at=scroll.current?.scrollTop??0;if(!await prepareLeave())return;readerScroll.current=at;setSelected(id);setTools(false);};
 const run=async(task:()=>Promise<Result<unknown>>,message='')=>{if(busy)return false;setBusy(true);setError('');try{if(!await prepareLeave())return false;const r=await task();if(!r.ok){setError(r.message);return false;}setNotice(message);return true;}catch{setError('操作未成功，内容已保留。');return false;}finally{setBusy(false);}};
 const label=nav.level==='year'?`${year}年`:nav.level==='day'?`${nav.day} 的念头`:nav.level==='monthIdeas'?`${nav.month} 的全部念头`:nav.level==='yearIdeas'?`${year}年的全部念头`:nav.level==='trash'?'最近删除':nav.level==='agents'?'Agent 标签':`${year}年${Number(nav.month.slice(5))}月`;
 const grid=nav.level==='month'&&!query.trim(),yearGrid=nav.level==='year'&&!query.trim();
 const monthDays=new Date(Date.UTC(Number(year),Number(nav.month.slice(5)),0)).getUTCDate(),offset=new Date(nav.month+'-01T12:00:00Z').getUTCDay();
 return <main data-view="manage" data-mode="calendar" data-material={info.manageMaterial} data-platform={info.platform} className="manage thought-calendar">
  <header className="auxiliary-header"><div className="calendar-heading">{(selected||history.length>0||nav.level!=='month')&&<IconButton icon="back" label="返回" onClick={()=>void back()}/>}<button className="calendar-title" onClick={()=>{if(nav.level==='month'&&!selected){setOrigin(null);void go({...nav,level:'year',scroll:0,limit:9});}}} title={nav.level==='month'?'查看全年十二个月':undefined}>{idea?.title??label}</button></div><div className="calendar-header-actions"><IconButton icon="more" label="日历更多选项" aria-expanded={tools} onClick={()=>setTools(!tools)}/><button className="close" aria-label="关闭日历" onClick={()=>void window.thoughtline.closeManage()}>×</button></div></header>
  {tools&&<div className="calendar-tools"><button onClick={()=>void go({...nav,level:'trash',scroll:0,limit:9})}>最近删除</button><button onClick={()=>void run(()=>window.thoughtline.openSettings())}>存储与设置</button><button onClick={()=>void go({...nav,level:'agents',scroll:0,limit:9})}>Agent 标签</button></div>}
  {idea?<IdeaReader key={idea.id} idea={idea} info={info} onRemoved={()=>{const at=cards.findIndex(i=>i.id===idea.id),next=cards[at+1]??cards[at-1];setSelected(next?.id??null);restoreScroll.current=readerScroll.current;}}/>:<>
   {nav.level!=='agents'&&<div className="calendar-search"><input aria-label="搜索念头" placeholder="搜索正文、名称或项目" value={query} onChange={e=>{setQuery(e.target.value);restoreScroll.current=0;if(scroll.current)scroll.current.scrollTop=0;setNav(n=>({...n,scroll:0,limit:9}));}}/><select aria-label="筛选念头状态" value={status} onChange={e=>{setStatus(e.target.value as typeof status);restoreScroll.current=0;if(scroll.current)scroll.current.scrollTop=0;setNav(n=>({...n,scroll:0,limit:9}));}}><option value="all">全部状态</option><option value="hanging">挂着</option><option value="archived">已收起</option></select></div>}
   {(grid||yearGrid)&&<div className="calendar-navigation"><button aria-label={yearGrid?'上一年':'上个月'} onClick={()=>{restoreScroll.current=0;setNav(n=>({...n,month:shiftMonth(n.month,yearGrid?-12:-1)}));}}>‹</button><button onClick={()=>{restoreScroll.current=0;setNav(initial);}}>今天</button><button onClick={()=>void go({...nav,level:yearGrid?'yearIdeas':'monthIdeas',scroll:0,limit:9})}>{yearGrid?`查看全年念头（${yearCount(year)}）`:`查看本月念头（${monthCount(nav.month)}）`}</button><button aria-label={yearGrid?'下一年':'下个月'} onClick={()=>{restoreScroll.current=0;setNav(n=>({...n,month:shiftMonth(n.month,yearGrid?12:1)}));}}>›</button></div>}
   <div ref={scroll} className="calendar-content" data-calendar-scroll>
    {grid?<div className="month-grid" aria-label={`${nav.month}月历`}>{['日','一','二','三','四','五','六'].map(d=><span className="weekday" key={d}>{d}</span>)}{Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:monthDays},(_,i)=>{const day=nav.month+'-'+pad(i+1),count=index.normal.get(day)?.length??0;return <button key={day} className="date-cell" data-day={day} aria-current={day===today?'date':undefined} aria-label={`${day}，${count}条念头`} onClick={e=>{const cell=e.currentTarget.getBoundingClientRect(),area=scroll.current?.getBoundingClientRect();setOrigin(area?{x:cell.left+cell.width/2-area.left,y:cell.top+cell.height/2-area.top}:null);void go({...nav,level:'day',day,scroll:0,limit:9});}}><span>{i+1}</span>{count>0&&<span className="day-count"><MiniClip/>{count}</span>}</button>;})}</div>:yearGrid?<div className="year-grid" aria-label={`${year}十二个月`}>{Array.from({length:12},(_,i)=>{const month=year+'-'+pad(i+1),count=monthCount(month);return <button key={month} data-month={month} onClick={()=>void go({...nav,level:'month',month,scroll:0,limit:9})}><strong>{i+1}月</strong><span>{count>0&&<MiniClip/>}{count}条</span></button>;})}</div>:nav.level==='agents'?<AgentSettings info={info} busy={busy} run={run}/>:<div className="calendar-paper-groups" style={{transformOrigin:origin?`${origin.x}px ${origin.y}px`:undefined}}>
     {shown.length===0&&<p className="empty-list">{nav.level==='trash'?'最近删除为空，不会自动清空。':'这里还没有念头。'}</p>}
     {[...new Set(shown.map(dayKey))].map(day=><section key={day} className="calendar-day-papers"><h2>{day}</h2><div className="paper-grid">{shown.filter(i=>dayKey(i)===day).map(i=><button className="calendar-paper" data-idea-id={i.id} key={i.id} onClick={()=>void openIdea(i.id)}><MiniClip/><strong>{i.title}</strong><span className="calendar-paper-text">{i.text}</span><small>{names.get(i.agentId)}{i.project?' · '+i.project:''}{i.status==='archived'?' · 已收起':''}</small></button>)}</div></section>)}
     {shown.length<cards.length&&<button className="calendar-load-more" onClick={()=>{restoreScroll.current=scroll.current?.scrollTop??0;setNav(n=>({...n,limit:n.limit+18}));}}>显示更多（还有{cards.length-shown.length}张）</button>}
    </div>}
   </div>
  </>}
  <footer className="calendar-footer"><span role="status">{info.placementNotice||notice}</span>{error&&<span className="error" role="alert">{error}</span>}</footer>
 </main>;
}
function MiniClip(){return <span className="mini-clip" aria-hidden="true"><Clothespin color="#D68665" reduced={true}/></span>;}
