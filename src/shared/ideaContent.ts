import type {Draft} from './contracts';
export const hasIdeaContent=(draft:Pick<Draft,'title'|'text'>)=>typeof draft.title==='string'&&typeof draft.text==='string'&&!!(draft.title.trim()||draft.text.trim());
