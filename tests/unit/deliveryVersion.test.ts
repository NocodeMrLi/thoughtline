// SPDX-License-Identifier: GPL-3.0-only
import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

describe('active Windows isolation delivery binding',()=>{
 it('builds Windows x64 explicitly even on an arm64 Mac host',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  expect(pkg.scripts['package:win']).toMatch(/--x64(?: |$)/);
  expect(pkg.build.win.target[0].arch).toEqual(['x64']);
 });
 it('binds the executable check and both isolated profile paths to the packaged version',()=>{
  const version=JSON.parse(readFileSync('package.json','utf8')).version;
  const launcher=readFileSync('docs/delivery/Start-Thoughtline-Isolated.ps1','utf8');
  const preflight=readFileSync('scripts/windows-installer-preflight.ps1','utf8');
  expect(launcher.match(/\.FileVersion -ne '([^']+)'/)?.[1]).toBe(version);
  for(const source of [launcher,preflight])expect(source.match(/Thoughtline-Preflight\\([^\\]+)\\user-data/)?.[1]).toBe(version);
 });
});
