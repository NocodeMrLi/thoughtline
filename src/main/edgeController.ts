import {screen} from 'electron';import {probeSeamAware,isNearProximity,type SeamTickState} from './vendor/edge-drop/stickProbe';import type {PlatformHost,Rect} from '../shared/contracts';import type {HitLayout} from '../shared/bridge';
import {contains,toLocal} from '../shared/ropeGeometry';import {initialShelf,shelfTransition,type ShelfEvent} from '../shared/shelfState';
export class EdgeController{
 private state=initialShelf();private timer:ReturnType<typeof setTimeout>|null=null;
 private rects:Rect[]=[];private layoutRevision=-1;private displayId='';private paused=false;
 private seam:SeamTickState={};private proximityDelay=400;
 private bounds:Rect={x:0,y:0,width:1200,height:340};
 constructor(private host:PlatformHost,private onDisplay:(id:string,width:number)=>void,private onStateChange:()=>void=()=>{}){}
 presentation(){return {shelfVisible:this.state.phase!=='hidden',interactionLocked:this.state.locks.length>0};}
 start(){this.poll();}
 stop(){if(this.timer)clearTimeout(this.timer);this.timer=null;this.host.hideShelf();}
 layout(payload:HitLayout){if(payload.displayId!==this.displayId||payload.layoutRevision<=this.layoutRevision)return;this.layoutRevision=payload.layoutRevision;this.rects=payload.rects;}
 event(event:ShelfEvent){const before=this.state.phase;const locked=this.state.locks.length>0;this.state=shelfTransition(this.state,event);this.render(before);if(before!==this.state.phase||locked!==(this.state.locks.length>0))this.onStateChange();}
 pause(value:boolean){this.paused=value;this.event({type:value?'suspend':'resume',now:Date.now()});}
 private render(before:string){
  if(this.state.phase==='hidden'){this.host.hideShelf();return;}
  if(before==='hidden')this.host.showShelf(this.bounds);
 }
 private poll=()=>{
  if(!this.paused){
   const point=this.host.cursor();const d=screen.getDisplayNearestPoint(point);
   if(String(d.id)!==this.displayId){
    this.event({type:'suspend',now:Date.now()});this.event({type:'resume',now:Date.now()});
    this.seam=this.displayId?{crossPending:true,restStreak:0}:{};this.displayId=String(d.id);this.bounds={x:d.bounds.x,y:Math.max(d.bounds.y,d.workArea.y),width:d.bounds.width,height:340};
    this.rects=[];this.layoutRevision=-1;this.onDisplay(this.displayId,this.bounds.width);
   }
   const local=toLocal(point,this.bounds);const hit=this.rects.some(r=>contains(r,local));
   const probe=probeSeamAware({cursor:point,workArea:d.bounds,stickPosition:'top',hotZoneWidth:3,now:Date.now()},this.seam);this.seam=probe.nextState;
   const edge=probe.armedInEdge;this.proximityDelay=probe.probe.distFromEdge>=0&&probe.probe.distFromEdge<=3?16:isNearProximity(probe.probe.distFromEdge)?100:400;
   const corridor=local.y>=0&&local.y<Math.min(300,this.bounds.height)&&local.x>=0&&local.x<this.bounds.width;
   this.event({type:'pointer',zone:edge?'edge':hit?'card':corridor?'corridor':'outside',now:Date.now()});
   this.event({type:'tick',now:Date.now()});
   this.host.setShelfInteractive(this.state.phase!=='hidden'&&hit);
  }
  const delay=this.paused?1000:this.state.phase!=='hidden'?16:this.proximityDelay;
  this.timer=setTimeout(this.poll,delay);
 };
}
