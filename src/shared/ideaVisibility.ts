import {shelfCapacity} from './ropeGeometry';
import type {Snapshot} from './contracts';
import {layoutClips} from './clipLayout';

/** Capacity is a view fact: reading/filtering/resizing must not rewrite notes. */
export function onLineIdeaIds(s:Snapshot,width:number,shelfAgentId='all'):Set<string>{
 const shown=layoutClips(s.clips,width,shelfCapacity(s.settings.shelfCapacity)).visible;
 // A label filter does not put away otherwise allocated clips. Old overflowing
 // clips can nevertheless fit when that label is shown by itself.
 const filtered=shelfAgentId==='all'?[]:layoutClips(s.clips.filter(c=>c.agentId===shelfAgentId),width,shelfCapacity(s.settings.shelfCapacity)).visible;
 return new Set([...shown,...filtered].flatMap(p=>p.clip.ideaIds));
}
