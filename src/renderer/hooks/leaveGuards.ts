// SPDX-License-Identifier: GPL-3.0-only
const guards=new Set<()=>Promise<boolean>>();
export function registerLeaveGuard(guard:()=>Promise<boolean>){guards.add(guard);return ()=>{guards.delete(guard);};}
export async function prepareLeave(){for(const guard of [...guards])if(!await guard())return false;return true;}
