import {writeFile,readFile,rename,open,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
export interface FileIO{write(path:string,text:string):Promise<void>;fsync(path:string):Promise<void>;rename(from:string,to:string):Promise<void>;read(path:string):Promise<string>;}
export const fileIO:FileIO={
  write:async(p,t)=>writeFile(p,t,{encoding:'utf8',mode:0o600}),
  fsync:async p=>{const f=await open(p,'r+');try{await f.sync();}finally{await f.close();}},
  rename,read:p=>readFile(p,'utf8')
};
export async function atomicWrite(path:string,text:string,io:FileIO=fileIO):Promise<void>{
 const temp=path+'.tmp-'+randomUUID();
 try{
   await io.write(temp,text);await io.fsync(temp);
   for(let attempt=0;;attempt++){
     try{await io.rename(temp,path);break;}catch(e){
       const code=(e as NodeJS.ErrnoException).code;
       if(process.platform!=='win32'||!['EPERM','EBUSY','EACCES'].includes(code??'')||attempt>=3)throw e;
       await new Promise(resolve=>setTimeout(resolve,[20,100,300][attempt]));
     }
   }
 }finally{await rm(temp,{force:true}).catch(()=>{});}
}
