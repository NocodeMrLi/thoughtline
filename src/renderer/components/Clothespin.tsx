import {useId} from 'react';
// Separate depth layers place rope and paper between front-facing wooden jaws.
export function Clothespin({color='#A0A3AA',reduced=false,layer='front'}:{color?:string;reduced?:boolean;layer?:'front'|'rear'}){
 const id=useId().replace(/:/g,'');
 return <svg className={layer==='rear'?'clothespin-rear':'clothespin'} data-material="painted-wood" data-facing="front" data-reduced={reduced} width="18" height="38" viewBox="0 0 18 38" aria-hidden="true" style={{color}}>
  <defs>
   <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#FFFFFF" stopOpacity=".28"/><stop offset=".2" stopColor="#FFFFFF" stopOpacity=".05"/><stop offset=".82" stopColor="#000000" stopOpacity=".04"/><stop offset="1" stopColor="#000000" stopOpacity=".24"/></linearGradient>
   <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5C6265"/><stop offset=".3" stopColor="#EFF0E8"/><stop offset=".6" stopColor="#919797"/><stop offset="1" stopColor="#626A6B"/></linearGradient>
  </defs>
  {layer==='rear'?<g className="pin-arm pin-back" data-part="rear-arm">
   <path d="M5 1.5 14.8 .4 16.2 1.7 15.7 16.1 14.7 18.8 16 24.5 15.6 37.2 5.2 37.6 5.7 24.2 6.3 18Z" fill="currentColor" stroke="#16161665" strokeWidth=".55"/>
   <path d="M14.8 1.7 15.2 16.3 14.4 18.7 15.2 24.3 15 36.7" fill="none" stroke="#FFFFFF45" strokeWidth=".55"/>
   <path d="M5 1.5 14.8 .4 16.2 1.7 15.7 16.1 14.7 18.8 16 24.5 15.6 37.2 5.2 37.6 5.7 24.2 6.3 18Z" fill="#00000018"/>
  </g>:<>
   <path data-part="paper-contact-shadow" d="M2.7 29.1h11.5l.8 8.8-11.5.5Z" fill="#000000" opacity=".2" transform="translate(.6 .7)"/>
   <g className="pin-arm pin-front" data-part="front-arm">
    <path d="M3 1.4 12.8 .9 14 2.1 13.4 16.1 12 18.5 13.9 22.7 13.4 36.8 12.5 37.8 3.2 37.5 2.5 36.5 3.1 23 4.3 18.6 3.7 16.1Z" fill="currentColor" stroke="#15151565" strokeWidth=".6"/>
    <path d="M3 1.4 12.8 .9 14 2.1 13.4 16.1 12 18.5 13.9 22.7 13.4 36.8 12.5 37.8 3.2 37.5 2.5 36.5 3.1 23 4.3 18.6 3.7 16.1Z" fill={`url(#${id}-bevel)`}/>
    <path d="m3.6 2.6 8.8-.4M3.7 3.2l.5 11.8M3.6 24.1l-.3 11.6M3.8 36.6l8 .2" fill="none" stroke="#FFFFFF70" strokeWidth=".55"/>
    <path d="m7 4 .3 9M7.7 25.4l-.3 8.6M11 26.5l-.2 5.5" fill="none" stroke="#15151520" strokeWidth=".4"/>
    <path d="M4.4 18.4h7.3M3.3 23.1l10.2-.2" stroke="#15151538" strokeWidth=".6"/>
   </g>
   <g data-part="silver-spring" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.9 20.1h8.8q1.4 0 1.9-1.2" stroke="#16161680" strokeWidth="1.7"/>
    <path d="M3.9 19.7h8.8q1.4 0 1.9-1.2" stroke={`url(#${id}-metal)`} strokeWidth="1.1"/>
    <path d="M14.5 16.5q1.5.5.8 1.6t-.7 1.6q1.5.6.7 1.7" stroke="#202525A0" strokeWidth="1.25"/>
    <path d="M14.4 16.3q1.3.5.7 1.6t-.6 1.5q1.3.6.6 1.6" stroke={`url(#${id}-metal)`} strokeWidth=".75"/>
   </g>
  </>}
 </svg>;
}
