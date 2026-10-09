type RGB=[number,number,number];
const lightPaper:RGB=[242,240,233],darkPaper:RGB=[179,175,162];
const luminance=(rgb:RGB)=>rgb.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a:RGB,b:RGB)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
// Keep the clip's hue/saturation. Only lower lightness enough for the label's paper region.
export function agentInkColors(color:string):{light:string;dark:string}{
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
  // Label sits above the lower curve/pressure shadow; its across-gradient can darken paper by at most 1.5%.
  const shaded=paper.map(v=>v*.985) as RGB;const original=[r,g,b].map(v=>Math.round(v*255)) as RGB;if(contrast(shaded,original)>=4.6)return hex.toLowerCase();let low=0,high=Math.min(l,.5);
  for(let n=0;n<24;n++){const mid=(low+high)/2;if(contrast(shaded,rgbAt(mid))>=4.6)low=mid;else high=mid;}
  return '#'+rgbAt(low).map(v=>v.toString(16).padStart(2,'0')).join('');
 };
 return {light:ink(lightPaper),dark:ink(darkPaper)};
}
