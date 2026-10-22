// SPDX-License-Identifier: GPL-3.0-only
import {expect,test,vi} from 'vitest';
const display=vi.hoisted(()=>({id:1,bounds:{x:-1440,y:0,width:1440,height:900},workArea:{x:-1440,y:25,width:1440,height:875}}));
vi.mock('electron',()=>({screen:{getDisplayNearestPoint:()=>display}}));
import {EdgeController} from '../../src/main/edgeController';
import type {PlatformHost} from '../../src/shared/contracts';
test.each(['mac','windows'] as const)('%s: menu-bar gap and slow corridor remain operable without intercepting empty space',platform=>{
 vi.useFakeTimers();vi.setSystemTime(0);let point={x:-720,y:1},interactive=false;
 const host:PlatformHost={platform,cursor:()=>point,displays:()=>[],showShelf:()=>{},hideShelf:()=>{},setShelfInteractive:v=>interactive=v,showComposer:()=>{},closeComposer:()=>{}};
 const edge=new EdgeController(host,()=>{});
 try{
  edge.start();vi.advanceTimersByTime(300);expect(edge.presentation().shelfVisible).toBe(true);
  point={x:-720,y:10};vi.advanceTimersByTime(1200);expect(edge.presentation().shelfVisible).toBe(true);expect(interactive).toBe(false);
  point={x:-720,y:33};vi.advanceTimersByTime(2000);expect(edge.presentation().shelfVisible).toBe(true);expect(interactive).toBe(false);
  edge.layout({displayId:'1',layoutRevision:1,rects:[{x:640,y:64,width:160,height:226}]});
  point={x:-720,y:125};vi.advanceTimersByTime(50);expect(interactive).toBe(true);
  point={x:-720,y:600};vi.advanceTimersByTime(480);expect(edge.presentation().shelfVisible).toBe(true);
  vi.advanceTimersByTime(50);expect(edge.presentation().shelfVisible).toBe(false);expect(interactive).toBe(false);
 }finally{edge.stop();vi.useRealTimers();}
});
