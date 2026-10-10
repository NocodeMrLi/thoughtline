import {expect,test,vi} from 'vitest';
import {EdgeController} from '../../src/main/edgeController';
import type {PlatformHost} from '../../src/shared/contracts';

test('轻提醒只显示透明窗口，挂绳仍隐藏；暂停与旧动画回执不能误显或误关',()=>{
 let visible=false;const host:PlatformHost={platform:'mac',cursor:()=>({x:600,y:500}),displays:()=>[],showShelf:()=>{visible=true;},hideShelf:()=>{visible=false;},setShelfInteractive:()=>{},showComposer:()=>{},closeComposer:()=>{}};
 const edge=new EdgeController(host,()=>{});
 try{edge.reminder(true);expect(visible).toBe(true);expect(edge.presentation().shelfVisible).toBe(false);edge.presentationFinished(0);expect(visible).toBe(true);edge.pause(true,'lock');expect(visible).toBe(false);edge.pause(false,'lock');expect(visible).toBe(true);expect(edge.presentation().shelfVisible).toBe(false);edge.reminder(false);expect(visible).toBe(false);}finally{edge.stop();}
});

test('收回阶段先穿透，完成动画才隐藏；旧完成通知不能关闭重新展开的挂绳',()=>{
 vi.useFakeTimers();let visible=false,interactive=false;
 const host:PlatformHost={platform:'mac',cursor:()=>({x:600,y:500}),displays:()=>[],showShelf:()=>{visible=true;},hideShelf:()=>{visible=false;},setShelfInteractive:v=>{interactive=v;},showComposer:()=>{},closeComposer:()=>{}};
 const edge=new EdgeController(host,()=>{});
 try{
  edge.event({type:'peek',now:0});expect(visible).toBe(true);
  edge.event({type:'tick',now:2400});expect(edge.presentation().shelfVisible).toBe(false);expect(interactive).toBe(false);expect(visible).toBe(true);
  const old=edge.presentation().presentationSession;
  edge.event({type:'peek',now:2500});edge.presentationFinished(old);expect(visible).toBe(true);
  edge.event({type:'tick',now:4900});const current=edge.presentation().presentationSession;
  edge.presentationFinished(current);expect(visible).toBe(false);
 }finally{edge.stop();vi.useRealTimers();}
});

test('渲染器没有完成通知时兜底隐藏，睡眠则立即隐藏',()=>{
 vi.useFakeTimers();let visible=false;
 const host:PlatformHost={platform:'mac',cursor:()=>({x:600,y:500}),displays:()=>[],showShelf:()=>{visible=true;},hideShelf:()=>{visible=false;},setShelfInteractive:()=>{},showComposer:()=>{},closeComposer:()=>{}};
 const edge=new EdgeController(host,()=>{});
 try{
  edge.event({type:'peek',now:0});edge.event({type:'tick',now:2400});expect(visible).toBe(true);
  vi.advanceTimersByTime(400);expect(visible).toBe(false);
  edge.event({type:'peek',now:3000});edge.pause(true,'sleep');expect(visible).toBe(false);
 }finally{edge.stop();vi.useRealTimers();}
});
