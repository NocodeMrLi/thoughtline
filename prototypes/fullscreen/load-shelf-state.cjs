const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
// Compile the unchanged real reducer into memory for isolated experimental tests.
const source=path.resolve(__dirname,'../../src/shared/shelfState.ts');
const output=require('esbuild').transformSync(fs.readFileSync(source,'utf8'),{loader:'ts',format:'cjs'}).code;
const moduleCopy=new Module(source,module);moduleCopy._compile(output,source);module.exports=moduleCopy.exports;
