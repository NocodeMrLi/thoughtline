import {useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {CompactPopover} from './CompactPopover';
import type {PilotInfo} from '../../shared/bridge';
import {defaultPaper,defaultRope,paperAppearance,paperColors,paperPatterns,paperPalettes,ropeAppearance,ropeColors,ropeStyles,type PaperAppearance,type RopeAppearance} from '../../shared/appearance';
import {fixedRope} from '../../shared/ropeGeometry';
import {useLocale} from '../LocaleContext';
import {ClipCard} from './ClipCard';
import {RopeArtwork,ropeStyle} from './RopeArtwork';
export type CustomizerKind='rope'|'paper';
export type AppearancePatch=Pick<PilotInfo['snapshot']['settings'],'rope'|'paper'>;
const names={classic:'经典细绳',cotton:'编织棉绳',vine:'轻藤蔓',warm:'经典暖纸',ivory:'柔白',apricot:'浅杏',sage:'雾绿',blue:'雾蓝',blank:'空白纸',ruled:'细横线',dashed:'轻虚线'} as const;
export function AppearanceSettings({info,busy,kind,onCustomize,onApply}:{info:PilotInfo;busy:boolean;kind:CustomizerKind|null;onCustomize:(kind:CustomizerKind|null)=>void;onApply:(patch:AppearancePatch)=>Promise<boolean>}){
 const {t}=useLocale(),savedRope=ropeAppearance(info.snapshot.settings.rope),savedPaper=paperAppearance(info.snapshot.settings.paper);
 const [rope,setRope]=useState<RopeAppearance>(savedRope),[paper,setPaper]=useState<PaperAppearance>(savedPaper);
 const [menu,setMenu]=useState<string|null>(null);
 const open=(next:CustomizerKind)=>{setRope(savedRope);setPaper(savedPaper);onCustomize(next);};
 if(!kind)return <div className="appearance-choices"><section className="appearance-choice"><div><strong>{t('挂绳')}</strong><small>{t(names[savedRope.style])}</small></div><button disabled={busy} onClick={()=>open('rope')}>{t('更换挂绳')}</button></section><section className="appearance-choice"><div><strong>{t('纸张')}</strong><small>{t(names[savedPaper.color])} · {t(names[savedPaper.pattern])}</small></div><button disabled={busy} onClick={()=>open('paper')}>{t('更换纸张')}</button></section><p className="setting-hint">{t('夹子颜色随标签设置，保持标签与夹子对应。')}</p></div>;
 const selected=(action:()=>void)=>{action();document.getElementById('appearance-trigger-'+menu)?.focus();setMenu(null);};
 const select=(id:string,label:string,value:ReactNode,children:ReactNode)=><AppearanceSelect id={id} label={label} value={value} busy={busy} open={menu===id} onToggle={()=>setMenu(menu===id?null:id)} onClose={()=>setMenu(null)}>{children}</AppearanceSelect>;
 const option=(label:string,chosen:boolean,action:()=>void,sample?:ReactNode)=><button key={label} disabled={busy} aria-pressed={chosen} onClick={()=>selected(action)}>{sample}<span>{label}</span><span className="appearance-check" aria-hidden="true">{chosen?'✓':''}</span></button>;
 return <section className="appearance-customizer" aria-label={t(kind==='rope'?'定制挂绳':'定制纸张')} onKeyDown={e=>{if(e.key==='Escape'&&!busy&&!e.nativeEvent.isComposing){e.stopPropagation();e.preventDefault();if(menu)setMenu(null);else onCustomize(null);}}}>
  <AppearancePreview rope={kind==='rope'?rope:savedRope} paper={kind==='paper'?paper:savedPaper}/>
  <div className="appearance-toolbar">
  {kind==='rope'?<>
   {select('rope-style',t('挂绳样式'),t(names[rope.style]),ropeStyles.map(style=>option(t(names[style]),rope.style===style,()=>setRope({style}),<RopeSample style={style}/>)))}
   {rope.style==='classic'?select('rope-color',t('挂绳颜色'),<><span className="color-dot" style={{background:rope.color??'#787d70'}}/>{t(rope.color&&!ropeColors.includes(rope.color)?'自定绳色':'绳色')}</>,<>
    <div className="rope-color-grid">{ropeColors.map((color,i)=><button key={color} disabled={busy} aria-label={t('绳色预设')+' '+(i+1)} aria-pressed={rope.color===color||!rope.color&&i===0} onClick={()=>selected(()=>setRope({style:'classic',color}))}><span className="color-dot" style={{background:color}}/></button>)}
    <label className="rope-custom-color"><input aria-label={t('自定绳色')} type="color" disabled={busy} value={rope.color??'#787d70'} onChange={e=>setRope({style:'classic',color:e.target.value})}/><span>{t('自定')}</span></label></div>
   </>):<div className="appearance-natural"><span>{t('绳色')}</span><span className="color-dot" style={{background:rope.style==='vine'?'#778856':'#C0B497'}}/><strong>{t(rope.style==='vine'?'自然绿色':'自然棉色')}</strong></div>}
  </>:<>
   {select('paper-color',t('纸张颜色'),<><span className="paper-color-chip" style={{background:paperPalettes[paper.color].light}}/>{t(names[paper.color])}</>,paperColors.map(color=>option(t(names[color]),paper.color===color,()=>setPaper({...paper,color}),<span className="paper-color-chip" style={{background:paperPalettes[color].light}}/>)))}
   {select('paper-pattern',t('纸面样式'),<><PaperSample pattern={paper.pattern}/>{t(names[paper.pattern])}</>,paperPatterns.map(pattern=>option(t(names[pattern]),paper.pattern===pattern,()=>setPaper({...paper,pattern}),<PaperSample pattern={pattern}/>)))}
  </>}
  </div>
  <div className="customizer-actions"><button className="text-button" disabled={busy} onClick={()=>kind==='rope'?setRope(defaultRope):setPaper(defaultPaper)}>{t(kind==='rope'?'恢复默认挂绳':'恢复默认纸张')}</button><div><button disabled={busy} onClick={()=>onCustomize(null)}>{t('取消')}</button><button className="primary" disabled={busy} onClick={async()=>{if(await onApply(kind==='rope'?{rope}:{paper}))onCustomize(null);}}>{t('应用')}</button></div></div>
 </section>;
}
function AppearanceSelect({id,label,value,busy,open,onToggle,onClose,children}:{id:string;label:string;value:ReactNode;busy:boolean;open:boolean;onToggle:()=>void;onClose:()=>void;children:ReactNode}){
 const anchor=useRef<HTMLDivElement>(null);
 return <div ref={anchor} className="appearance-select"><span>{label}</span><button id={'appearance-trigger-'+id} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?'appearance-options-'+id:undefined} disabled={busy} onClick={onToggle} onKeyDown={e=>{if(!open&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();onToggle();}}}><span>{value}</span><span aria-hidden="true">⌄</span></button>
 {open&&<CompactPopover anchor={anchor} label={label} className="appearance-select-panel" busy={busy} onClose={onClose} initialFocusSelector="button[aria-pressed=true]"><div id={'appearance-options-'+id} role="group" aria-label={label} onKeyDown={e=>{
  if(e.nativeEvent.isComposing||e.target instanceof HTMLInputElement)return;
  const options=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],at=options.indexOf(document.activeElement as HTMLButtonElement);
  const next=e.key==='ArrowDown'||e.key==='ArrowRight'?(at+1)%options.length:e.key==='ArrowUp'||e.key==='ArrowLeft'?(at-1+options.length)%options.length:e.key==='Home'?0:e.key==='End'?options.length-1:null;
  if(next!==null){e.preventDefault();options[next]?.focus();}
 }}>{children}</div></CompactPopover>}
 </div>;
}
function RopeSample({style}:{style:RopeAppearance['style']}){
 const geometry={left:4,length:120,top:12,sag:7};return <svg className="rope rope-sample" width="96" height="42" viewBox="0 0 128 56" aria-hidden="true" style={ropeStyle({style})}><RopeArtwork rope={geometry} anchors={[]} appearance={{style}}/></svg>;
}
function PaperSample({pattern}:{pattern:PaperAppearance['pattern']}){
 return <svg className="paper-pattern-sample" width="30" height="26" viewBox="0 0 30 26" aria-hidden="true"><rect x=".5" y=".5" width="29" height="25" rx="2"/>{pattern!=='blank'&&[7,13,19].map(y=><path key={y} d={`M4 ${y}H26`} strokeDasharray={pattern==='dashed'?'3 3':undefined}/>)}</svg>;
}

function AppearancePreview({rope,paper}:{rope:RopeAppearance;paper:PaperAppearance}){
 const {t}=useLocale(),host=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:260,height:260});
 const sceneWidth=400,sceneHeight=300,scale=Math.max(.1,Math.min(1,(size.width-16)/sceneWidth,(size.height-16)/sceneHeight));
 useLayoutEffect(()=>{const observer=new ResizeObserver(()=>setSize({width:host.current?.clientWidth??260,height:host.current?.clientHeight??260}));if(host.current)observer.observe(host.current);return()=>observer.disconnect();},[]);
 const width=sceneWidth,geometry=fixedRope(width,4),id='appearance-sample',idea={id,title:t('今天的念头'),text:t('先写下来，慢慢理清。')+'\ngyp: keep it simple.\n'+t('给自己留一点呼吸。'),project:'',agentId:'preview-tag',status:'hanging' as const,createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z'};
 return <div ref={host} className="appearance-preview" inert aria-hidden="true" style={ropeStyle(rope)}><div className="appearance-scene" style={{width:sceneWidth,height:sceneHeight,left:(size.width-sceneWidth*scale)/2,top:(size.height-sceneHeight*scale)/2,transform:`scale(${scale})`}}><svg className="rope" width={width} height="140"><RopeArtwork rope={geometry} anchors={[width/2]} appearance={rope}/></svg><div className="preview-paper-position" style={{left:width/2-80,top:geometry.top+geometry.sag}}><div className="scaled-paper" style={{'--paper-scale':1} as CSSProperties}><ClipCard appearance={paper} clip={{id,agentId:idea.agentId,ideaIds:[id],currentId:id,position:null}} ideas={[idea]} agent={{id:idea.agentId,name:t('生活灵感'),color:'#DB44B4'}} onChange={async()=>false} onGrab={()=>{}} onError={()=>{}} reduced textDragActive={false} ropeContact="M0 27H18"/></div></div></div></div>;
}
