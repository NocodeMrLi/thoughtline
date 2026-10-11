export const paperColors=['warm','ivory','apricot','sage','blue'] as const;
export const paperPatterns=['blank','ruled','dashed'] as const;
export const ropeStyles=['classic','cotton','vine'] as const;
export type PaperColor=typeof paperColors[number];
export type PaperPattern=typeof paperPatterns[number];
export type PaperAppearance={color:PaperColor;pattern:PaperPattern};
export type RopeAppearance={style:'classic';color?:string}|{style:'cotton'|'vine';color?:never};
export const defaultPaper:PaperAppearance={color:'warm',pattern:'blank'};
export const defaultRope:RopeAppearance={style:'classic'};
export const paperPalettes:Record<PaperColor,{light:string;dark:string}>={
 warm:{light:'#F5EFDF',dark:'#383831'},ivory:{light:'#F3F1E8',dark:'#363837'},
 apricot:{light:'#F2E8DB',dark:'#3C3531'},sage:{light:'#E8ECE1',dark:'#333B34'},blue:{light:'#E7EBEF',dark:'#333940'}
};
export const ropeColors=['#787D70','#C0B497','#8B735E','#718B78','#6C899B','#747980'];
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export const validRope=(x:unknown):x is RopeAppearance=>record(x)&&ropeStyles.includes(x.style as RopeAppearance['style'])&&(x.color===undefined||x.style==='classic'&&typeof x.color==='string'&&/^#[0-9a-f]{6}$/i.test(x.color))&&Object.keys(x).every(k=>k==='style'||k==='color');
export const validPaper=(x:unknown):x is PaperAppearance=>record(x)&&paperColors.includes(x.color as PaperColor)&&paperPatterns.includes(x.pattern as PaperPattern)&&Object.keys(x).every(k=>k==='color'||k==='pattern');
export const paperAppearance=(x:unknown):PaperAppearance=>validPaper(x)?x:defaultPaper;
export const ropeAppearance=(x:unknown):RopeAppearance=>validRope(x)?x:defaultRope;
