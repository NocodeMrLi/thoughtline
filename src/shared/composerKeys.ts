export type SubmitKey={platform:'mac'|'windows';key:string;metaKey:boolean;ctrlKey:boolean;isComposing:boolean;keyCode:number};
export function shouldSubmit(input: SubmitKey): boolean {
  if(input.isComposing || input.keyCode===229)return false;
  return input.key==='Enter'&&(input.platform==='mac'?input.metaKey:input.ctrlKey);
}
