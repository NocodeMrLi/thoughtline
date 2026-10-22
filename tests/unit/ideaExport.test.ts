// SPDX-License-Identifier: GPL-3.0-only
import {afterEach,expect,test} from 'vitest';
import * as fs from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {inflateRawSync} from 'node:zlib';
import {initialSnapshot} from '../../src/shared/ideaCommands';
import type {Idea,Snapshot} from '../../src/shared/contracts';
import {saveThoughtDocument} from '../../src/main/store/ideaExport';

const parseXML=createRequire(import.meta.url)('xml-js').xml2js;
const dirs:string[]=[];
const stamp=new Date('2026-10-13T06:30:00Z');
const note=(id:string,patch:Partial<Idea>={}):Idea=>({id,title:'会议',text:'第一段😀 < & >\n\n  第二段\t尾部\n',project:'工作',agentId:'leader',status:'archived',createdAt:'2026-10-10T01:00:00Z',updatedAt:'2026-10-10T01:00:00Z',...patch});
function fixture():Snapshot {return {...initialSnapshot(),agents:[{id:'general',name:'通用',color:'#888888'},{id:'leader',name:'领导A',color:'#ff0000'}],projects:['工作'],inactiveAgents:['leader'],inactiveProjects:['工作'],ideas:[note('later',{text:'后来的同名念头',createdAt:'2026-10-11T01:00:00Z'}),note('first'),note('blank',{project:'',agentId:'general',title:'',text:'只有正文'}),note('deleted',{status:'deleted',text:'最近删除不能混入'})],draft:{title:'草稿',text:'草稿不能混入',project:'工作',agentId:'leader'}};}
async function directory(){const dir=await fs.mkdtemp(join(tmpdir(),'thoughtline-export-unit-'));dirs.push(dir);return dir;}
afterEach(async()=>{for(const dir of dirs.splice(0))await fs.rm(dir,{recursive:true,force:true});});
// Independently read ZIP local entries with Node zlib, not the DOCX writer's ZIP implementation.
function xmlFromDocx(bytes:Buffer):string {let offset=0;while(bytes.readUInt32LE(offset)===0x04034b50){const method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+18),n=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28),name=bytes.subarray(offset+30,offset+30+n).toString(),start=offset+30+n+extra;if(name==='word/document.xml')return (method===8?inflateRawSync(bytes.subarray(start,start+size)):bytes.subarray(start,start+size)).toString('utf8');offset=start+size;}throw Error('DOCX document part missing');}
test('TXT preserves every active record and four fields, excludes draft/deleted, keeps inactive classifications and duplicate names',async()=>{
 const snapshot=fixture(),before=structuredClone(snapshot),path=join(await directory(),'念头.txt');
 const result=await saveThoughtDocument(snapshot,path,'txt','zh-CN',stamp);expect(result).toEqual({ok:true,value:{path,count:3}});
 const bytes=await fs.readFile(path),text=bytes.toString('utf8').replace(/\r\n/g,'\n');expect(bytes.subarray(0,3)).toEqual(Buffer.from([0xef,0xbb,0xbf]));
 expect(text).toContain('分组：工作\n标签：领导A\n名称：会议\n内容：\n第一段😀 < & >\n\n  第二段\t尾部\n');
 expect(text).toContain('分组：未分组\n标签：通用\n名称：未命名念头\n内容：\n只有正文');
 expect(text.indexOf('第一段')).toBeLessThan(text.indexOf('后来的同名'));expect(text.match(/名称：会议/g)).toHaveLength(2);expect(text).not.toContain('草稿不能混入');expect(text).not.toContain('最近删除不能混入');expect(snapshot).toEqual(before);
});
test('DOCX is a readable OOXML ZIP whose paragraphs preserve Unicode, XML symbols, whitespace and all four fields',async()=>{
 const path=join(await directory(),'念头.docx');expect((await saveThoughtDocument(fixture(),path,'docx','zh-CN',stamp)).ok).toBe(true);
 const bytes=await fs.readFile(path);expect(bytes.subarray(0,4)).toEqual(Buffer.from([80,75,3,4]));const xml=xmlFromDocx(bytes),tree=parseXML(xml,{compact:true});expect(tree['w:document']['w:body']).toBeTruthy();
 const texts:string[]=[];const visit=(n:any)=>{if(!n||typeof n!=='object')return;if(n['w:t']){for(const t of [n['w:t']].flat())texts.push(String(t._text??''));}for(const [key,value] of Object.entries(n))if(key!=='w:t')for(const child of [value].flat())visit(child);};visit(tree);
 for(const expected of ['分组：工作','标签：领导A','名称：会议','内容：','第一段😀 < & >','  第二段','尾部','后来的同名念头','名称：未命名念头'])expect(texts).toContain(expected);
 expect(texts.join('\n')).not.toMatch(/草稿不能混入|最近删除不能混入/);expect(xml).toContain('xml:space="preserve"');expect(xml).toContain('<w:tab');
});
test('English export localizes labels and default names but never translates user text',async()=>{const path=join(await directory(),'notes.txt');expect((await saveThoughtDocument(fixture(),path,'txt','en',stamp)).ok).toBe(true);const text=await fs.readFile(path,'utf8');expect(text).toContain('Group: 工作');expect(text).toContain('Tag: 领导A');expect(text).toContain('Name: Untitled thought');expect(text).toContain('只有正文');});
test('long body and title-only records export completely; empty export is explained without creating a file',async()=>{const dir=await directory(),path=join(dir,'long.txt'),snapshot=fixture();snapshot.ideas=[note('long',{text:'长文😀\n'.repeat(10000)}),note('title',{text:'',title:'仅标题'})];expect((await saveThoughtDocument(snapshot,path,'txt','zh-CN',stamp)).ok).toBe(true);expect((await fs.readFile(path,'utf8')).match(/长文😀/g)).toHaveLength(10000);snapshot.ideas=[];const empty=join(dir,'empty.txt');expect(await saveThoughtDocument(snapshot,empty,'txt','zh-CN',stamp)).toMatchObject({ok:false,code:'INVALID'});await expect(fs.stat(empty)).rejects.toMatchObject({code:'ENOENT'});});
test.each(['write','rename'])('failed %s keeps previous destination bytes and cleans only the export temporary file',async stage=>{const dir=await directory(),path=join(dir,'existing.txt');await fs.writeFile(path,'KEEP ORIGINAL');const io={...fs,...(stage==='write'?{writeFile:async()=>{throw Object.assign(Error('ENOSPC'),{code:'ENOSPC'});}}:{rename:async()=>{throw Object.assign(Error('EACCES'),{code:'EACCES'});}})};expect(await saveThoughtDocument(fixture(),path,'txt','zh-CN',stamp,io)).toMatchObject({ok:false,code:'IO'});expect(await fs.readFile(path,'utf8')).toBe('KEEP ORIGINAL');expect(await fs.readdir(dir)).toEqual(['existing.txt']);});
test('wrong extension is corrected, valid existing files are replaced and source data remains intact',async()=>{const dir=await directory(),path=join(dir,'snapshot.json'),snapshot=fixture();await fs.writeFile(path,'protected source');const r=await saveThoughtDocument(snapshot,path,'txt','zh-CN',stamp);expect(r).toMatchObject({ok:true,value:{path:path+'.txt'}});expect(await fs.readFile(path,'utf8')).toBe('protected source');await fs.writeFile(path+'.txt','old export');expect((await saveThoughtDocument(snapshot,path+'.txt','txt','zh-CN',stamp)).ok).toBe(true);expect(await fs.readFile(path+'.txt','utf8')).toContain('第一段');});
