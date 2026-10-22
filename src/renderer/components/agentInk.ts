// SPDX-License-Identifier: GPL-3.0-only
type RGB=[number,number,number];
const lightPaper:RGB=[245,239,223],darkPaper:RGB=[56,56,49];
const luminance=(rgb:RGB)=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a:RGB,b:RGB)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
// Preserve the clip's hue/saturation; adjust label lightness for the current paper palette.
export function agentInkColors(color:string,palette?:{light:string;dark:string}):{light:string;dark:string}{
 const hex=/^#[0-9a-f]{6}$/i.test(color)?color:'#A0A3AA';
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;
 const saturation=d===0?0:d/(1-Math.abs(2*l-1));let hue=0;
 if(d)hue=((hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)/6);
 const rgbAt=(lightness:number):RGB=>{
  const c=(1-Math.abs(2*lightness-1))*saturation,h=hue*6,x=c*(1-Math.abs(h%2-1)),m=lightness-c/2;
  const channels=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return channels.map(v=>Math.floor((v+m)*255)) as RGB;
 };
 const ink=(paper:RGB)=>{
  // Label is above the lower fold. Bound both across-paper extrema (black1.5%, white4.5%).
  const darkest=paper.map(v=>v*.985) as RGB,brightest=paper.map(v=>v*.955+255*.045) as RGB;
  const readable=(rgb:RGB)=>Math.min(contrast(darkest,rgb),contrast(brightest,rgb))>=4.6;
  const original=[r,g,b].map(v=>Math.round(v*255)) as RGB;if(readable(original))return hex.toLowerCase();
  const lighten=luminance(paper)<.18;let low=lighten?l:0,high=lighten?1:l;
  for(let n=0;n<24;n++){const mid=(low+high)/2;if(readable(rgbAt(mid))===lighten)high=mid;else low=mid;}
  return '#'+rgbAt(lighten?high:low).map(v=>v.toString(16).padStart(2,'0')).join('');
 };
 const paperRGB=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as RGB;
 return {light:ink(palette?paperRGB(palette.light):lightPaper),dark:ink(palette?paperRGB(palette.dark):darkPaper)};
}
