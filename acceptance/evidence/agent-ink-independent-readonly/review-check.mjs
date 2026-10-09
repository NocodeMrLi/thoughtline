import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {agentInkColors} from './agentInk.ts';
const read=async name=>JSON.parse(await fs.readFile(new URL(name,import.meta.url),'utf8'));
const before=await read('before/result.json'),after=await read('after/result.json');
const fixedFields=['clipId','variant','outline','agent','clipColor','label','paper','titleColor','bodyColor','text'];
let cards=0;
for(const s of after.scenes){
 const old=before.scenes.find(o=>o.theme===s.theme);assert.deepEqual(s.geometry.viewport,old.geometry.viewport);assert.equal(s.geometry.rope,old.geometry.rope);
 for(let i=0;i<s.geometry.cards.length;i++){
  const c=s.geometry.cards[i],o=old.geometry.cards[i];for(const field of fixedFields)assert.deepEqual(c[field],o[field]);
  if(c.agent==='通用'){assert.equal(c.computedStyle,o.computedStyle);assert.deepEqual(c.inkRgb,o.inkRgb);}cards++;
 }
}
const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
const lum=values=>values.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const model=[];
for(const [agent,color] of [['Codex','#4C90D9'],['Claude','#D79551']]){
 const ink=agentInkColors(color);
 for(const theme of ['light','dark']){
  assert(/^#[0-9a-f]{6}$/.test(ink[theme]));const paper=(theme==='light'?[242,240,233]:[179,175,162]).map(v=>v*.985);
  const ratio=(lum(paper)+.05)/(lum(rgb(ink[theme]))+.05);assert(ratio>=4.6);
  assert.deepEqual(after.scenes.find(s=>s.theme===theme).geometry.cards.find(c=>c.agent===agent).inkRgb,rgb(ink[theme]));model.push({agent,theme,color:ink[theme],contrastOn1_5PercentDarkenedLabelPaper:ratio});
 }
}
const report={sourceCommit:'796bbeaac9ba3d2f2895dd26b7fab695b620d735',scope:'Independent immutable source function execution and before/after recorded fields; no browser/Electron/native',sameIdentityBodyOutlineFrameCardsVerified:cards,fixedFields,neutralAgentUnchanged:true,titleAndBodyColorsUnchanged:true,model,fullVisualAcceptance:false};
await fs.writeFile(new URL('review-check.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
