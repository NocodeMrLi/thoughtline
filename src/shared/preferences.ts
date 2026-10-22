// SPDX-License-Identifier: GPL-3.0-only
export type Locale='zh-CN'|'en';
export type Theme='system'|'light'|'dark';
export type Preferences={schemaVersion:1;version:number;locale:Locale;theme:Theme};
export type PreferencePatch=Partial<Pick<Preferences,'locale'|'theme'>>;
export const validPatch=(p:unknown):p is PreferencePatch=>!!p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length>0&&Object.entries(p).every(([k,v])=>k==='locale'?v==='zh-CN'||v==='en':k==='theme'&&(v==='system'||v==='light'||v==='dark'));
export const validPreferences=(p:unknown):p is Preferences=>!!p&&typeof p==='object'&&Object.keys(p).length===4&&(p as Preferences).schemaVersion===1&&Number.isSafeInteger((p as Preferences).version)&&(p as Preferences).version>=0&&validPatch({locale:(p as Preferences).locale,theme:(p as Preferences).theme});
export function newerPreferences(current:Preferences,incoming:Preferences):Preferences{return incoming.version>=current.version?incoming:current;}
