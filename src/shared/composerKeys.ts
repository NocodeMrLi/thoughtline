export type SubmitKey={platform:'mac'|'windows';key:string;metaKey:boolean;ctrlKey:boolean;isComposing:boolean;keyCode:number};
export function displayWriteHotkey(value:string,platform:'mac'|'windows'):string{
 const labels:Record<string,string>=platform==='mac'?{Command:'⌘',Super:'⌘',Control:'⌃',Alt:'⌥',Shift:'⇧',Space:'空格'}:{Control:'Ctrl',Super:'Win'};
 return value.split('+').map(part=>labels[part]??part).join(platform==='mac'?'':' + ');
}
export function shouldSubmit(input: SubmitKey): boolean {
  if(input.isComposing || input.keyCode===229)return false;
  return input.key==='Enter'&&(input.platform==='mac'?input.metaKey:input.ctrlKey);
}
export function validWriteHotkey(value:unknown):value is string{
 if(typeof value!=='string'||value.length>100)return false;
 const parts=value.split('+'),key=parts.pop();
 return !!key&&/^(?:[A-Z0-9]|F(?:[1-9]|1\d|2[0-4])|Space)$/.test(key)&&parts.length>0&&new Set(parts).size===parts.length&&parts.every(x=>['Command','Control','Alt','Shift','Super'].includes(x))&&parts.some(x=>x!=='Shift');
}
export function recordWriteHotkey(event:{code:string;metaKey:boolean;ctrlKey:boolean;altKey:boolean;shiftKey:boolean;isComposing:boolean},platform:'mac'|'windows'):string|null{
 if(event.isComposing)return null;
 const key=/^(?:Key[A-Z]|Digit[0-9])$/.test(event.code)?event.code.replace(/^(Key|Digit)/,''):/^(?:F(?:[1-9]|1\d|2[0-4])|Space)$/.test(event.code)?event.code:null;
 if(!key)return null;
 const parts=[event.metaKey?(platform==='mac'?'Command':'Super'):null,event.ctrlKey?'Control':null,event.altKey?'Alt':null,event.shiftKey?'Shift':null,key].filter(Boolean);
 const value=parts.join('+');return validWriteHotkey(value)?value:null;
}
