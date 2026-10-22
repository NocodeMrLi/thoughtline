// SPDX-License-Identifier: GPL-3.0-only
import {createContext,useContext,useMemo,type ReactNode} from 'react';
import type {Locale} from '../shared/preferences';
import {translator,localizeMessage,agentLabel} from '../shared/i18n';
const LocaleContext=createContext<Locale>('zh-CN');
export function LocaleProvider({locale,children}:{locale:Locale;children:ReactNode}){return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;}
export function useLocale(){const locale=useContext(LocaleContext);return useMemo(()=>({locale,t:translator(locale),m:(message:string|null|undefined)=>localizeMessage(locale,message),agentName:(agent:{id:string;name:string}|undefined)=>agentLabel(locale,agent)}),[locale]);}
