// SPDX-License-Identifier: GPL-3.0-only
import {it,expect} from 'vitest';
import {composerMaterial} from '../../src/shared/composerMaterial';
it('uses supported native materials with accessibility, inactive and old-Windows fallback',()=>{
 expect(composerMaterial('darwin','24.3.0',false,false,false)).toBe('vibrancy');
 expect(composerMaterial('win32','10.0.22621',false,false,false)).toBe('acrylic');
 expect(composerMaterial('win32','10.0.22000',false,false,false)).toBe('opaque');
 expect(composerMaterial('win32','10.0.19045',false,false,false)).toBe('opaque');
 expect(composerMaterial('win32','10.0.22631',false,false,false,false)).toBe('opaque');
 for(const platform of ['darwin','win32'])for(const flags of [[true,false,false],[false,true,false],[false,false,true]])expect(composerMaterial(platform,'10.0.22631',...flags as [boolean,boolean,boolean])).toBe('opaque');
});
