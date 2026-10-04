import {ProjectDiagnosticCache,compilerDiagnostic} from '../language/diagnostics.js';

// This file is bundled into the standalone IDE, not fetched from a CDN.
const cache=new ProjectDiagnosticCache();
globalThis.onmessage=event=>{
  const message=event.data;
  if(message?.type!=='diagnostics-check'||!Number.isSafeInteger(message.revision))return;
  let result;
  try {result=cache.check(message.project);}
  catch(error){result={diagnostics:[compilerDiagnostic(error,message.project?.name||'Project')],valid:false,stats:{compiledModules:0,cacheHits:0,totalModules:0}};}
  globalThis.postMessage({type:'diagnostics-result',revision:message.revision,result});
};
