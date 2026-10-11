import {expect,test} from 'vitest';
import {paperColors,paperPatterns,paperPalettes,validPaper,validRope,paperAppearance,ropeAppearance} from '../../src/shared/appearance';
import {initialSnapshot,validateSnapshot} from '../../src/shared/ideaCommands';
import {agentInkColors} from '../../src/renderer/components/agentInk';
import {vineArtwork} from '../../src/shared/ropeArtwork';
import {fixedRope,fixedRopeY} from '../../src/shared/ropeGeometry';
import {layoutClips} from '../../src/shared/clipLayout';
test('legacy appearance defaults preserve classic warm blank paper and original cord',()=>{
 const old=initialSnapshot();expect(validateSnapshot(old).ok).toBe(true);expect(old.settings.paper).toBeUndefined();expect(paperAppearance(undefined)).toEqual({color:'warm',pattern:'blank'});expect(ropeAppearance(undefined)).toEqual({style:'classic'});
});
test('only approved paper presets and patterns are persisted; arbitrary paper RGB is rejected',()=>{
 for(const color of paperColors)for(const pattern of paperPatterns)expect(validateSnapshot({...initialSnapshot(),settings:{...initialSnapshot().settings,paper:{color,pattern}}}).ok).toBe(true);
 for(const paper of [{color:'#FF0000',pattern:'blank'},{color:'warm',pattern:'grid'},{color:'warm',pattern:'ruled',image:'photo'},null]){expect(validPaper(paper)).toBe(false);expect(validateSnapshot({...initialSnapshot(),settings:{...initialSnapshot().settings,paper}}).ok).toBe(false);}
 for(const rope of [{style:'classic',color:'#aabbcc'},{style:'vine'},{style:'classic'}])expect(validRope(rope)).toBe(true);
 for(const rope of [{style:'vine',color:'red'},{style:'unknown'},{style:'cotton',script:'bad'},{style:'cotton',color:'#aabbcc'},{style:'vine',color:'#FF0000'},null])expect(validateSnapshot({...initialSnapshot(),settings:{...initialSnapshot().settings,rope}}).ok).toBe(false);
});
const lum=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
test('tag hue stays readable against every paper color in both themes',()=>{
 for(const palette of Object.values(paperPalettes))for(const color of ['#FFFFFF','#000000','#FF0000','#00FF00','#0000FF','#DB44B4','#4D90B4','#B78356','#A0A3AA']){const ink=agentInkColors(color,palette);for(const theme of ['light','dark'] as const){const a=lum(ink[theme]),b=lum(palette[theme]);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.6);}}
});
test('vine stem and tangent meet every actual jaw in 4/6/8 layouts and during dragging',()=>{
 for(const width of [800,1280,1440,2560])for(const capacity of [4,6,8] as const){const rope=fixedRope(width,capacity),clips=Array.from({length:capacity},(_,i)=>({id:'c'+i,agentId:'general',ideaIds:['i'+i],currentId:'i'+i,position:null})),anchors=layoutClips(clips,width,capacity).visible.map(p=>p.x);anchors[1]+=17;const vine=vineArtwork(rope,anchors);for(const x of anchors){expect(vine.y(x)).toBe(fixedRopeY(x,rope));const h=.001;expect((vine.y(x+h)-vine.y(x-h))/(2*h)).toBeCloseTo((fixedRopeY(x+h,rope)-fixedRopeY(x-h,rope))/(2*h),4);}expect(vine.branches.every(b=>anchors.every(x=>Math.abs(x-b.x)>=30))).toBe(true);}
});
