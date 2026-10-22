// SPDX-License-Identifier: GPL-3.0-only
// Fresh profiles only. Loading an existing snapshot never inserts or renames tags.
export const DEFAULT_TAGS = [
 {id:'general',name:'通用',color:'#A0A3AA'},
 {id:'preset:life-inspiration',name:'生活灵感',color:'#6CA78C'},
 {id:'preset:work-notes',name:'工作记录',color:'#D79551'},
 {id:'preset:manager',name:'直属领导',color:'#9574CE'},
 {id:'preset:colleague',name:'同事',color:'#8AADD4'},
 {id:'codex',name:'Codex',color:'#4C90D9'}
] as const;
