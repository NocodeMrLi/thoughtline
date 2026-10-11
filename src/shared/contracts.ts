import type {PaperAppearance,RopeAppearance} from './appearance';
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type AgentId = string;
export type Reminder = {at:string;state:'scheduled'|'notified'|'missed'|'failed'|'cancelled';attemptedAt?:string};
export type Idea = {
  id: string; text: string; title: string; project: string; agentId: AgentId;
  status: 'hanging' | 'archived' | 'deleted'; createdAt: string; updatedAt: string;
  createdDay?: string; creationTimeZone?: string;
  deletedAt?: string; deletedFrom?: 'hanging' | 'archived';
  deletedClip?: {id:string;index:number;position:number|null};
  reminder?: Reminder;
  offRopeReason?: 'waiting' | 'capacity' | 'manual' | 'replaced';
};
export type AgentTag = { id: AgentId; name: string; color: string };
export type Draft = { text: string; title: string; project: string; agentId: AgentId; reminderAt?:string };
export type Clip = {id:string; agentId:AgentId; ideaIds:string[]; currentId:string; position:number|null};
export type Snapshot = {
  schemaVersion: 2 | 3; revision: number; clips:Clip[]; capacityOverflow?:Clip[]; ideas: Idea[]; agents: AgentTag[]; draft: Draft | null;
  settings: { writeHotkey: string; reducedMotion: boolean; shelfCapacity?: 4 | 6 | 8; calendarBounds?: Rect; rope?:RopeAppearance; paper?:PaperAppearance };
};
export type Result<T> = { ok: true; value: T } | {
  ok: false; code: 'INVALID' | 'CONFLICT' | 'IO' | 'MISSING_BODY'; message: string;
};
export interface Repository {
  load(): Promise<Result<Snapshot>>;
  commit(next: Snapshot, expectedRevision: number): Promise<Result<Snapshot>>;
}
export interface PlatformHost {
  platform: 'mac' | 'windows'; cursor(): Point;
  displays(): { id: string; bounds: Rect; workArea: Rect; scaleFactor: number }[];
  showShelf(bounds: Rect): void; hideShelf(): void; setShelfInteractive(value: boolean): void;
  showComposer(bounds: Rect): void; closeComposer(): void;
}
export type DragResult = { accepted: boolean; format: 'text/plain'; target?: string };
