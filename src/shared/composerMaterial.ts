// SPDX-License-Identifier: GPL-3.0-only
export type ComposerMaterial='vibrancy'|'acrylic'|'opaque';
export function composerMaterial(platform:string,release:string,reduceTransparency:boolean,highContrast:boolean,forcedColors:boolean,focused=true):ComposerMaterial{
 if(reduceTransparency||highContrast||forcedColors)return 'opaque';
 if(platform==='darwin')return 'vibrancy';
 if(platform==='win32'&&Number(release.split('.')[2])>=22621&&focused)return 'acrylic';
 return 'opaque';
}
