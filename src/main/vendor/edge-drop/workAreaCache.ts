// WorkAreaRect interface extracted from Edge-Drop workAreaCache.ts.
// Source commit 469fd0d56d8d4073ed5a6fbcab36953db8203cae; Apache-2.0.
// Modification: retain only the pure rectangle type; Electron owns display enumeration.
export interface WorkAreaRect{x:number;y:number;width:number;height:number;}
