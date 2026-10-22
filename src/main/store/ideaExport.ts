// SPDX-License-Identifier: GPL-3.0-only
import * as fs from 'node:fs/promises';
import {extname,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Document,Packer,Paragraph,TextRun,Tab,HeadingLevel} from 'docx';
import type {Result,Snapshot} from '../../shared/contracts';
import type {Locale} from '../../shared/preferences';
import {agentLabel} from '../../shared/i18n';
export type DocumentFormat='txt'|'docx';
export type DocumentOutput={path:string;count:number};
type ExportIO=Pick<typeof fs,'writeFile'|'rename'|'open'|'rm'|'lstat'>;
export function documentPath(path:string,format:DocumentFormat):string{return extname(path).toLowerCase()==='.'+format?path:path+'.'+format;}
/** Export a detached, readable view. Neither sorting nor display defaults mutate the snapshot. */
export async function saveThoughtDocument(snapshot:Snapshot,destination:string,format:DocumentFormat,locale:Locale,time:Date,io:ExportIO=fs):Promise<Result<DocumentOutput>>{
 const ideas=snapshot.ideas.filter(idea=>idea.status==='hanging'||idea.status==='archived');
 if(!ideas.length)return {ok:false,code:'INVALID',message:locale==='en'?'There are no thoughts to export.':'暂无可导出的念头。'};
 if(!isAbsolute(destination)||!['txt','docx'].includes(format))return {ok:false,code:'INVALID',message:locale==='en'?'Invalid export location or format.':'导出位置或格式无效。'};
 const path=documentPath(destination,format),temporary=path+'.tmp-'+randomUUID();let owned=false;
 try{
  try{const stat=await io.lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw Error('Destination is not a regular file');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const en=locale==='en',labels=en?{group:'Group: ',tag:'Tag: ',name:'Name: ',body:'Content:',untitled:'Untitled thought',ungrouped:'Ungrouped'}:{group:'分组：',tag:'标签：',name:'名称：',body:'内容：',untitled:'未命名念头',ungrouped:'未分组'};
  const tags=new Map(snapshot.agents.map(a=>[a.id,agentLabel(locale,a)]));
  const grouped=new Map<string,typeof ideas>();
  for(const idea of [...ideas].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))){const items=grouped.get(idea.project)??[];items.push(idea);grouped.set(idea.project,items);}
  const groups=[...new Set(['',...(snapshot.projects??[]),...grouped.keys()])].filter(group=>grouped.has(group));
  type Line={text:string;kind?:'title'|'group'|'name'};const lines:Line[]=[{text:en?'Thoughtline · Thoughts':'晾念头 · 念头汇总',kind:'title'},{text:(en?'Exported: ':'导出时间：')+time.toLocaleString(locale)},{text:en?`Total: ${ideas.length} thoughts`:`共 ${ideas.length} 条念头`},{text:''}];
  for(const group of groups){lines.push({text:group||labels.ungrouped,kind:'group'});for(const idea of grouped.get(group)!){lines.push({text:labels.group+(group||labels.ungrouped)},{text:labels.tag+(tags.get(idea.agentId)??idea.agentId)},{text:labels.name+(idea.title.trim()?idea.title:labels.untitled),kind:'name'},{text:labels.body},...idea.text.split(/\r\n|\r|\n/).map(text=>({text})),{text:''});}}
  let data:Buffer;
  if(format==='txt')data=Buffer.from('\uFEFF'+lines.map(line=>line.text).join('\r\n')+'\r\n','utf8');
  else{
   // XML 1.0 cannot represent these control characters. Refuse rather than silently lose user text.
   if(lines.some(line=>/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(line.text)))return {ok:false,code:'INVALID',message:en?'This content contains characters unsupported by DOCX. Please export TXT.':'内容含 DOCX 不支持的控制字符，请导出 TXT。'};
   const document=new Document({creator:'Thoughtline',title:lines[0].text,styles:{default:{document:{run:{font:'Arial',size:22},paragraph:{spacing:{after:100,line:280}}}}},sections:[{children:lines.map(line=>new Paragraph({heading:line.kind==='title'?HeadingLevel.TITLE:line.kind==='group'?HeadingLevel.HEADING_1:undefined,keepNext:!!line.kind,spacing:{after:line.kind==='group'?180:80},children:[new TextRun({bold:line.kind==='name',children:line.text.split('\t').flatMap((text,index)=>index?[new Tab(),text]:[text])})]}))}]});
   data=await Packer.toBuffer(document);
  }
  // A new same-directory temporary file is complete and synced before replacing the chosen destination.
  const handle=await io.open(temporary,'wx',0o600);owned=true;await handle.close();
  await io.writeFile(temporary,data);const sync=await io.open(temporary,'r+');try{await sync.sync();}finally{await sync.close();}
  for(let attempt=0;;attempt++){try{await io.rename(temporary,path);break;}catch(e){if(process.platform!=='win32'||!['EPERM','EBUSY','EACCES'].includes((e as NodeJS.ErrnoException).code??'')||attempt>=3)throw e;await new Promise(resolve=>setTimeout(resolve,[20,100,300][attempt]));}}
  owned=false;return {ok:true,value:{path,count:ideas.length}};
 }catch{return {ok:false,code:'IO',message:locale==='en'?'Export failed. Check the location, free space and whether the file is open, then try again.':'导出未完成，请检查保存位置、剩余空间或文件是否被占用后重试。'};}
 finally{if(owned)await io.rm(temporary,{force:true}).catch(()=>{});}
}
