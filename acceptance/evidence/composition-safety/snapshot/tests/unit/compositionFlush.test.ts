import {it,expect,vi,afterEach} from 'vitest';
import {DraftAutosaver} from '../../src/shared/draftAutosaver';
afterEach(()=>vi.useRealTimers());
it('flush refuses a paused draft instead of checkpointing its intermediate value',async()=>{
 vi.useFakeTimers();const write=vi.fn(async()=>{}),a=new DraftAutosaver('',write,vi.fn());
 a.pause();a.update('未确认');await expect(a.flush()).rejects.toThrow();
 expect(write).not.toHaveBeenCalled();a.update('确认');a.resume();await a.flush();expect(write).toHaveBeenCalledExactlyOnceWith('确认');
});
it('pause during a pending flush prevents the next intermediate write',async()=>{
 vi.useFakeTimers();let release!:()=>void;const seen:string[]=[];
 const a=new DraftAutosaver('',async v=>{seen.push(v);await new Promise<void>(r=>release=r);},vi.fn());
 a.update('完成');await vi.advanceTimersByTimeAsync(800);const flushed=expect(a.flush()).rejects.toThrow();a.pause();a.update('未确认');release();await flushed;expect(seen).toEqual(['完成']);a.dispose();
});
