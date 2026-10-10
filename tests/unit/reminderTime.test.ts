import {afterEach,expect,test,vi} from 'vitest';
import {localReminderInput,parseReminderInput,reminderLabel,reminderPreset} from '../../src/shared/reminderTime';
afterEach(()=>vi.unstubAllEnvs());
test('presets preserve elapsed minutes, but tomorrow is local 09:00 across daylight saving',()=>{
 vi.stubEnv('TZ','America/New_York');const now=new Date('2026-03-07T14:00:00.000Z');expect(reminderPreset('quarter',now)).toBe('2026-03-07T14:15:00.000Z');expect(reminderPreset('hour',now)).toBe('2026-03-07T15:00:00.000Z');expect(reminderPreset('tomorrow',now)).toBe('2026-03-08T13:00:00.000Z');
});
test('custom input rejects impossible dates and daylight saving gaps instead of silently moving the time',()=>{
 vi.stubEnv('TZ','America/New_York');expect(parseReminderInput('2026-02-30T09:00')).toBeNull();expect(parseReminderInput('2026-03-08T02:30')).toBeNull();expect(parseReminderInput('2026-03-08T09:00')).toBe('2026-03-08T13:00:00.000Z');expect(localReminderInput('2026-03-08T13:00:00.000Z')).toBe('2026-03-08T09:00');expect(reminderLabel('2026-03-08T13:00:00.000Z','en',new Date('2026-03-07T14:00:00.000Z'))).toBe('Tomorrow 09:00');
});
