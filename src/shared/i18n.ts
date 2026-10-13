import {zh,en} from './messages';import type {Locale} from './preferences';
import {DEFAULT_TAGS} from './tagPresets';
export const dictionaries={'zh-CN':zh,en};export type MessageKey=keyof typeof zh;
type Slots<S extends string>=S extends `${string}{${infer P}}${infer Rest}`?P|Slots<Rest>:never;
type Args<K extends MessageKey>=[Slots<(typeof zh)[K]>] extends [never]?[]:[params:Record<Slots<(typeof zh)[K]>,string|number>];
export type Translator=<K extends MessageKey>(key:K,...args:Args<K>)=>string;
export const translator=(locale:Locale):Translator=>(key,...args)=>translate(locale,key,...args);
export function translate<K extends MessageKey>(locale:Locale,key:K,...args:Args<K>):string {const params=args[0] as Record<string,string|number>|undefined;return dictionaries[locale][key].replace(/\{(\w+)\}/g,(_,p)=>String(params?.[p]??`{${p}}`));}
export const countThoughts=(locale:Locale,n:number)=>locale==='en'?`${n} ${new Intl.PluralRules('en').select(n)==='one'?'thought':'thoughts'}`:`${n}条念头`;
export function formatCalendarDate(locale:Locale,key:string,kind:'day'|'month'|'year'|'monthName'='day'):string{const [y,m=1,d=1]=key.split('-').map(Number);return new Intl.DateTimeFormat(locale,{timeZone:'UTC',...(kind==='year'?{year:'numeric' as const}:kind==='monthName'?{month:'long' as const}:kind==='month'?{year:'numeric' as const,month:'long' as const}:{year:'numeric' as const,month:'long' as const,day:'numeric' as const})}).format(new Date(Date.UTC(y,m-1,d,12)));}
export const agentLabel=(locale:Locale,agent:{id:string;name:string}|undefined)=>{
 if(!agent)return '';
 const preset=DEFAULT_TAGS.find(a=>a.id===agent.id&&a.name===agent.name);
 return preset&&preset.name!=='Codex'?translate(locale,preset.name):agent.name;
};
// Reverse only complete app-owned status/error envelopes, never arbitrary UI/date templates.
const exactMessages=(Object.keys(zh) as MessageKey[]).filter(key=>!zh[key].includes('{'));
const envelopes=['localSaveFailureDetail','storageFailure','outerStorageFailure','fileMismatch','changedLocation','savedBackup','exportSaved'] as const;
/** App diagnostics and path slots stay byte-for-byte intact. Only nested app-error wrappers recurse. */
export function localizeMessage(locale:Locale,message:string|null|undefined):string{
 if(!message)return '';
 for(const key of exactMessages)if(message===key||message===zh[key]||message===en[key])return dictionaries[locale][key];
 for(const key of envelopes)for(const source of ['zh-CN','en'] as const){
  const template=dictionaries[source][key],slot=template.match(/\{\w+\}/)![0],at=template.indexOf(slot),prefix=template.slice(0,at),suffix=template.slice(at+slot.length);
  if(message.startsWith(prefix)&&message.endsWith(suffix)&&message.length>=prefix.length+suffix.length){
   const raw=message.slice(prefix.length,suffix?message.length-suffix.length:undefined);
   const value=key==='storageFailure'||key==='outerStorageFailure'?localizeMessage(locale,raw):raw;
   return dictionaries[locale][key].replace(/\{\w+\}/,()=>value);
  }
 }
 return message;
}
