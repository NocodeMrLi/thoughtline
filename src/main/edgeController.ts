import {screen} from 'electron';import {probeSeamAware,isNearProximity,type SeamTickState} from './vendor/edge-drop/stickProbe';import type {PlatformHost,Rect} from '../shared/contracts';import type {HitLayout} from '../shared/bridge';
import {motion} from '../shared/motionTokens';
import {contains,toLocal} from '../shared/ropeGeometry';import {initialShelf,shelfTransition,pauseTransition,type PauseReason,type ShelfEvent} from '../shared/shelfState';
export class EdgeController{
 private state=initialShelf();private timer:ReturnType<typeof setTimeout>|null=null;
 private rects:Rect[]=[];private layoutRevision=-1;private displayId='';private paused=false;
 private pauses={manual:false,sleep:false,lock:false,paused:false};
 private nativeVisible=false;private hideTimer:ReturnType<typeof setTimeout>|null=null;private presentationSession=0;private reminderOverlay=false;
 private seam:SeamTickState={};private proximityDelay=400;
 private bounds:Rect={x:0,y:0,width:1200,height:340};
 constructor(private host:PlatformHost,private onDisplay:(id:string,width:number)=>void,private onStateChange:()=>void=()=>{}){}
 presentation(){return {shelfVisible:this.state.phase!=='hidden',interactionLocked:this.state.locks.length>0,presentationSession:this.presentationSession};}
 reminder(active:boolean){if(this.reminderOverlay===active)return;this.reminderOverlay=active;if(this.paused)return;if(active){this.cancelHide();this.host.showShelf(this.bounds);this.nativeVisible=true;}else if(this.state.phase==='hidden')this.forceHide();}
 start(){this.poll();}
 stop(){if(this.timer)clearTimeout(this.timer);this.timer=null;this.forceHide();}
 private cancelHide(){if(this.hideTimer)clearTimeout(this.hideTimer);this.hideTimer=null;}
 private forceHide(){this.cancelHide();this.presentationSession++;this.host.setShelfInteractive(false);this.host.hideShelf();this.nativeVisible=false;}
 presentationFinished(session:number){if(session!==this.presentationSession||this.state.phase!=='hidden'||!this.hideTimer)return;this.cancelHide();if(this.reminderOverlay&&!this.paused)return;this.host.hideShelf();this.nativeVisible=false;}
 layout(payload:HitLayout){if(payload.displayId!==this.displayId||payload.layoutRevision<=this.layoutRevision)return;this.layoutRevision=payload.layoutRevision;this.rects=payload.rects;}
 event(event:ShelfEvent){const before=this.state.phase;const locked=this.state.locks.length>0;this.state=shelfTransition(this.state,event);const session=this.presentationSession;this.render(before,event.type==='suspend');if(session!==this.presentationSession||before!==this.state.phase||locked!==(this.state.locks.length>0))this.onStateChange();}
 isManuallyPaused(){return this.pauses.manual;}
 pause(value:boolean,reason:PauseReason='manual'){this.pauses=pauseTransition(this.pauses,reason,value);if(this.paused===this.pauses.paused)return;this.paused=this.pauses.paused;this.event({type:this.paused?'suspend':'resume',now:Date.now()});}
 private render(before:string,immediate:boolean){
  if(immediate){this.forceHide();return;}
  if(this.reminderOverlay&&!this.paused&&!this.nativeVisible){this.host.showShelf(this.bounds);this.nativeVisible=true;}
  if(this.state.phase==='hidden'){
   if(this.reminderOverlay){this.cancelHide();return;}
   this.host.setShelfInteractive(false);
   if(this.nativeVisible&&before!=='hidden'){
    this.cancelHide();const session=++this.presentationSession;
    // The renderer acknowledges its final painted frame; a stalled renderer still closes.
    this.hideTimer=setTimeout(()=>this.presentationFinished(session),motion.hide+120);
   }
   return;
  }
  if(before==='hidden'){
   this.cancelHide();this.presentationSession++;this.host.showShelf(this.bounds);this.nativeVisible=true;
  }
 }
 private poll=()=>{
  if(!this.paused){
   const point=this.host.cursor();const d=screen.getDisplayNearestPoint(point);
   const nextBounds={x:d.bounds.x,y:Math.max(d.bounds.y,d.workArea.y),width:d.bounds.width,height:340};
   if(String(d.id)!==this.displayId||nextBounds.x!==this.bounds.x||nextBounds.y!==this.bounds.y||nextBounds.width!==this.bounds.width){
    this.event({type:'suspend',now:Date.now()});this.event({type:'resume',now:Date.now()});
    this.seam=this.displayId&&String(d.id)!==this.displayId?{crossPending:true,restStreak:0}:{};this.displayId=String(d.id);this.bounds=nextBounds;
    this.rects=[];this.layoutRevision=-1;this.onDisplay(this.displayId,this.bounds.width);
   }
   const local=toLocal(point,this.bounds);const hit=this.rects.some(r=>contains(r,local));
   const probe=probeSeamAware({cursor:point,workArea:d.bounds,stickPosition:'top',hotZoneWidth:3,now:Date.now()},this.seam);this.seam=probe.nextState;
   const edge=probe.armedInEdge;this.proximityDelay=probe.probe.distFromEdge>=0&&probe.probe.distFromEdge<=3?16:isNearProximity(probe.probe.distFromEdge)?100:400;
   // Include the menu-bar gap above the panel: users cross it on the way from
   // the physical top edge to paper. This corridor does not capture mouse input.
   const corridor=point.y>=d.bounds.y&&local.y<Math.min(300,this.bounds.height)&&local.x>=0&&local.x<this.bounds.width;
   this.event({type:'pointer',zone:edge?'edge':hit?'card':corridor?'corridor':'outside',now:Date.now()});
   this.event({type:'tick',now:Date.now()});
   this.host.setShelfInteractive((this.state.phase!=='hidden'||this.reminderOverlay)&&(hit||this.state.locks.includes('drag')||this.state.locks.includes('text-drag')));
  }
  const delay=this.paused?1000:this.state.phase!=='hidden'||this.reminderOverlay?16:this.proximityDelay;
  this.timer=setTimeout(this.poll,delay);
 };
}
