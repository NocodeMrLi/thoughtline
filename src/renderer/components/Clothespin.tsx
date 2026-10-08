import {useId} from 'react';
// Small-size vector interpretation of design 13; no raster asset or continuous animation.
export function Clothespin({color='#A0A3AA',reduced=false}:{color?:string;reduced?:boolean}){
 const id=useId().replace(/:/g,'');
 return <svg className="clothespin" data-material="painted-wood" data-reduced={reduced} width="18" height="38" viewBox="0 0 18 38" aria-hidden="true" style={{color}}>
  <defs>
   <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="currentColor"/><stop offset=".3" stopColor="currentColor"/><stop offset="1" stopColor="currentColor" stopOpacity=".78"/></linearGradient>
   <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#707578"/><stop offset=".3" stopColor="#F5F4E9"/><stop offset=".55" stopColor="#919697"/><stop offset=".8" stopColor="#ECEDE6"/><stop offset="1" stopColor="#636A6E"/></linearGradient>
  </defs>
  <path className="pin-side" d="M12 .8 16 2.2 14.7 35.6 11.5 38 8.1 33.5 8.2 17Z" fill="currentColor" stroke="#11111145" strokeWidth=".7"/>
  <g className="pin-arm pin-back">
   <path d="M10.8 1 14.8 1.5 13.4 19.7 13.8 35.8 10.1 37.4 7.9 32.3 9.5 26.7 8.8 20.5Z" fill={`url(#${id}-paint)`} stroke="#16161655" strokeWidth=".65"/>
   <path d="m11.2 2.5-1.4 15M12.6 25.6l.1 9" stroke="#FFFFFF30" strokeWidth=".5"/>
  </g>
  <g className="pin-arm pin-front">
   <path d="M2.3 2.2 6.9 1.5 9.2 18.1 8.9 26 9.5 32.8 7.7 37.7 2.9 37 2.9 26.3 3.5 24.7Z" fill={`url(#${id}-paint)`} stroke="#16161660" strokeWidth=".65"/>
   <path d="m2.9 3 3.1-.4M3.1 3.3l1.1 18M3.6 27.5v7.8" stroke="#FFFFFF65" strokeWidth=".7"/>
   <path d="m5.2 5 .9 13M5.1 29l.2 5.5" stroke="#11111122" strokeWidth=".45"/>
  </g>
  <path d="M8.6 31.2 7.8 35.7 9.3 37.5 10.2 35" fill="#16161665"/>
  <g data-part="silver-spring" fill="none" strokeLinecap="round">
   <path d="M3 24.5 8 25.5C9 25.7 9.8 25.2 10.2 24L13.4 18.5" stroke="#11111170" strokeWidth="2.3"/>
   <path d="M3 24 8 25C9 25.2 9.7 24.7 10.1 23.5L13.3 18" stroke={`url(#${id}-metal)`} strokeWidth="1.5"/>
   <ellipse cx="12" cy="16.7" rx="3.2" ry="4.3" stroke="#16161670" strokeWidth="1.9"/>
   <ellipse cx="12" cy="16.4" rx="3" ry="4" stroke={`url(#${id}-metal)`} strokeWidth="1.2"/>
   <ellipse cx="12" cy="16.4" rx="1.65" ry="2.8" stroke={`url(#${id}-metal)`} strokeWidth=".9"/>
   <path d="M12 13.5c-1.5.7-1.9 3.6-.3 5.1" stroke="#FFFFFFB0" strokeWidth=".45"/>
  </g>
 </svg>;
}
