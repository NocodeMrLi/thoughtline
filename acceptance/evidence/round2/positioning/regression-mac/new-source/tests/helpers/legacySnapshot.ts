import {initialSnapshot} from '../../src/shared/ideaCommands';
// Explicit persisted pre-positioning fixture. Old-user coverage must not depend
// on the presets chosen for a newly created profile.
export function legacySnapshot(){
 return {...initialSnapshot(),agents:[
  {id:'codex',name:'Codex',color:'#4C90D9'},
  {id:'claude',name:'Claude',color:'#D79551'},
  {id:'cursor',name:'Cursor',color:'#9574CE'},
  {id:'general',name:'通用',color:'#A0A3AA'}
 ]};
}
