// SPDX-License-Identifier: GPL-3.0-only
import {test,expect,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import {showNotification} from '../../src/shared/notificationDelivery';
class Notice extends EventEmitter{show(){} close(){this.emit('close');}}
test('native show confirmation is distinct from supported or unknown',async()=>{const n=new Notice(),click=vi.fn();const delivered=showNotification(n,click,20);n.emit('show');expect(await delivered).toBe(true);n.emit('click');expect(click).toHaveBeenCalledTimes(1);n.emit('click');expect(click).toHaveBeenCalledTimes(1);});
test('native failure or missing confirmation is not a delivery success',async()=>{const n=new Notice(),failed=showNotification(n,()=>{},20);n.emit('failed','permissions');expect(await failed).toBe(false);const silent=new Notice();expect(await showNotification(silent,()=>{},10)).toBe(false);});
