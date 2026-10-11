import type {CSSProperties} from 'react';
import {paperAppearance,paperPalettes,type PaperAppearance} from '../../shared/appearance';
export function paperStyle(paper?:PaperAppearance):CSSProperties{
 const palette=paperPalettes[paperAppearance(paper).color];
 return {'--paper-light':palette.light,'--paper-dark':palette.dark} as CSSProperties;
}
