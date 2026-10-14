import {expect,test} from 'vitest';
import {fitManageBounds} from '../../src/main/windows/manageGeometry';
const area={x:0,y:0,width:1000,height:800},paper={x:300,y:25,width:160,height:264};
test('小面板默认避纸下方16DIP，屏边12DIP',()=>{expect(fitManageBounds({x:250,y:120,width:360,height:330},[area],[paper],{preferredArea:area})).toEqual({x:250,y:305,width:360,height:330});});
test('下方不足时侧方放置，负坐标工作区仍在屏内',()=>{const a={x:-1000,y:-200,width:1000,height:450};const p={x:-600,y:-180,width:160,height:264};const r=fitManageBounds({x:-620,y:-140,width:360,height:300},[a],[p],{preferredArea:a});expect(r.x+r.width<=p.x||r.x>=p.x+p.width).toBe(true);expect(r.x).toBeGreaterThanOrEqual(a.x+12);expect(r.y).toBeGreaterThanOrEqual(a.y+12);expect(r.y+r.height).toBeLessThanOrEqual(a.y+a.height-12);});
test('手动位置缩短高度不移动左上角，极小工作区有界',()=>{const r=fitManageBounds({x:400,y:400,width:360,height:160},[area],[],{preserve:true,preferredArea:area});expect(r).toEqual({x:400,y:400,width:360,height:160});const tiny=fitManageBounds({x:50,y:80,width:360,height:330},[{x:0,y:0,width:280,height:230}]);expect(tiny.width).toBe(256);expect(tiny.height).toBe(206);});
