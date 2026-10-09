import { defineConfig } from 'electron-vite';
import {resolve} from 'node:path';
const output=(part:string)=>process.env.THOUGHTLINE_BUILD_DIR?resolve(process.env.THOUGHTLINE_BUILD_DIR,part):undefined;
export default defineConfig({
  main: { build: { outDir:output('main'), rollupOptions: { input: 'src/main/index.ts' } } },
  preload: { build: { outDir:output('preload'), rollupOptions: { input: 'src/preload/index.ts' } } },
  renderer: { build: { outDir:output('renderer'), rollupOptions: { input: 'src/renderer/index.html' } } }
});
