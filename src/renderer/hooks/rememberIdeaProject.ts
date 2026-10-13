import type {PilotInfo,ThoughtlineBridge} from '../../shared/bridge';
type Scope=Pick<PilotInfo,'snapshot'|'manageSession'>;
type Bridge={info:()=>Promise<Scope>;classificationChange:ThoughtlineBridge['classificationChange']};
export async function rememberIdeaProject(bridge:Bridge,ideaId:string,session:number,alive:()=>boolean):Promise<void>{
 const current=await bridge.info(),record=current.snapshot.ideas.find(i=>i.id===ideaId);
 if(!alive()||current.manageSession!==session)throw Error('编辑会话已结束，文字仍在窗口中。');
 if(!record?.project||current.snapshot.projects?.includes(record.project))return;
 const result=await bridge.classificationChange({kind:'rememberProject',ideaId,session},current.snapshot.revision);
 if(result.ok)return;
 // Re-read only a real version conflict. Ownership/IO failures still block leave.
 if(result.code!=='CONFLICT'||!alive())throw Error(result.message);
 const fresh=await bridge.info(),latest=fresh.snapshot.ideas.find(i=>i.id===ideaId);
 if(!alive()||fresh.manageSession!==session||fresh.snapshot.revision<=current.snapshot.revision||!latest||latest.status==='deleted'||latest.project!==record.project)throw Error(result.message);
 if(fresh.snapshot.projects?.includes(latest.project))return;
 const retried=await bridge.classificationChange({kind:'rememberProject',ideaId,session},fresh.snapshot.revision);
 if(!retried.ok)throw Error(retried.message);
}
