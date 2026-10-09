import type {PilotInfo} from '../shared/bridge';
// A preceding write from this renderer may advance durability without replacing
// its latest intent. A different renderer's commit or a later local commit does.
export function acceptsPreferenceFailure(request:number,base:number,info:Pick<PilotInfo,'preferences'|'preferenceCommit'>):boolean{
 const commit=info.preferenceCommit;
 return info.preferences.version===base||!!(commit?.own&&commit.sequence<request&&commit.version===info.preferences.version);
}
