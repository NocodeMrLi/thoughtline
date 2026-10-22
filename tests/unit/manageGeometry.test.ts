// SPDX-License-Identifier: GPL-3.0-only
import {describe,it,expect} from 'vitest';
import {fitManageBounds} from '../../src/main/windows/manageGeometry';

describe('manage window bounds',()=>{
 it('keeps a saved window visible on a secondary screen with negative origin',()=>{
  expect(fitManageBounds({x:-1800,y:100,width:740,height:540},[{x:0,y:0,width:1440,height:900},{x:-1920,y:0,width:1920,height:1080}]))
   .toEqual({x:-1800,y:100,width:740,height:540});
 });
 it('moves a disconnected secondary window onto the remaining display',()=>{
  expect(fitManageBounds({x:2000,y:100,width:740,height:540},[{x:0,y:0,width:1440,height:900}]))
   .toEqual({x:688,y:100,width:740,height:540});
 });
 it('fits an oversized saved window into a compact scaled work area',()=>{
  expect(fitManageBounds({x:0,y:0,width:1200,height:900},[{x:0,y:0,width:1024,height:768}]))
   .toEqual({x:12,y:12,width:1000,height:744});
 });
 it('clamps a 150 percent scaled work area with nonzero origin',()=>{
  expect(fitManageBounds({x:1900,y:950,width:740,height:540},[{x:1280,y:0,width:1280,height:960}]))
   .toEqual({x:1808,y:408,width:740,height:540});
 });
});
