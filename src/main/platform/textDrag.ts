import type {DragResult} from '../../shared/contracts';
export const textDragStatus:DragResult={accepted:false,format:'text/plain'};
// G6前不提供拖入入口，不将文件startDrag或浏览器dragend当作正文接收证据。
