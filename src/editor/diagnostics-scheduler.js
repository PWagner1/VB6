import {ProjectDiagnosticCache,diagnosticSnapshot} from '../language/diagnostics.js';
import {DIAGNOSTICS_WORKER_SOURCE} from './diagnostics-payload.js';

export function createDiagnosticWorker() {
  if(typeof Worker!=='function'||typeof URL?.createObjectURL!=='function')return null;
  const url=URL.createObjectURL(new Blob([DIAGNOSTICS_WORKER_SOURCE],{type:'text/javascript'}));
  try {const worker=new Worker(url,{name:'VB6 syntax diagnostics'});worker.releaseSource=()=>URL.revokeObjectURL(url);return worker;}
  catch(error){URL.revokeObjectURL(url);throw error;}
}

/** Latest-revision-only scheduler. A worker never executes VB source. If workers
 * are unavailable/blocked, parsing yields between modules on the main thread.
 * New edits supersede old results without racing across projects or run states. */
export class DiagnosticsScheduler {
  constructor({onResult=()=>{},onState=()=>{},workerFactory=createDiagnosticWorker,delay=280,timeout=15000}={}) {
    this.onResult=onResult;this.onState=onState;this.workerFactory=workerFactory;this.delay=delay;this.timeout=timeout;
    this.revision=0;this.target=null;this.busy=null;this.timer=null;this.worker=null;this.workerUnavailable=false;
    this.cache=new ProjectDiagnosticCache();this.mode='idle';this.pending=false;this.disposed=false;
    this.metrics={requests:0,responses:0,discarded:0,workerStarts:0,fallbackRuns:0,compiledModules:0,cacheHits:0};
  }
  schedule(project,delay=this.delay) {
    if(this.disposed)return this.revision;
    this.target={revision:++this.revision,project};this.metrics.requests++;
    clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;this.start();},Math.max(0,delay));this.state();return this.revision;
  }
  state(){this.pending=!!this.target;this.onState({pending:this.pending,mode:this.mode,revision:this.revision});}
  start() {
    if(this.disposed||!this.target||this.busy)return;
    const target=this.target;let snapshot;
    try {snapshot=diagnosticSnapshot(target.project);}
    catch(error){this.busy={revision:target.revision};this.complete(this.busy,{diagnostics:[{severity:'warning',origin:'syntax',source:target.project?.name||'Project',line:1,column:1,message:error.message}],valid:false,stats:{compiledModules:0,cacheHits:0,totalModules:0}});return;}
    const job=this.busy={revision:target.revision,project:snapshot};
    if(!this.worker&&!this.workerUnavailable) {
      try {this.worker=this.workerFactory?.()||null;if(!this.worker)this.workerUnavailable=true;
        else {this.metrics.workerStarts++;this.worker.onmessage=e=>{if(e.data?.type==='diagnostics-result'&&e.data.revision===this.busy?.revision)this.complete(this.busy,e.data.result);else this.metrics.discarded++;};
          this.worker.onerror=e=>{e.preventDefault?.();this.workerFailed();};this.worker.onmessageerror=()=>this.workerFailed();}
      } catch {this.workerUnavailable=true;}
    }
    if(this.worker) {
      this.mode='worker';this.watchdog=setTimeout(()=>this.workerFailed(),this.timeout);
      try {this.worker.postMessage({type:'diagnostics-check',revision:job.revision,project:snapshot});this.state();return;}
      catch {this.workerFailed();return;}
    }
    this.fallback(job);
  }
  workerFailed() {
    if(this.workerUnavailable&&!this.worker)return;
    const job=this.busy;this.stopWorker();this.workerUnavailable=true;
    if(job&&!this.disposed)this.fallback(job);
  }
  fallback(job) {
    this.mode='fallback';this.metrics.fallbackRuns++;this.state();const steps=this.cache.steps(job.project);
    const tick=()=>{
      if(this.disposed||this.busy!==job)return;
      if(this.target?.revision!==job.revision){this.metrics.discarded++;this.busy=null;if(this.target&&!this.timer)this.start();this.state();return;}
      try {const next=steps.next();if(next.done)this.complete(job,next.value);else this.fallbackTimer=setTimeout(tick,0);}
      catch(error){this.complete(job,{diagnostics:[{severity:'warning',origin:'syntax',source:job.project.name,line:1,column:1,message:'Automatic syntax checking failed: '+error.message}],valid:false,stats:{compiledModules:0,cacheHits:0,totalModules:0}});}
    };
    this.fallbackTimer=setTimeout(tick,0);
  }
  complete(job,result) {
    if(this.disposed||this.busy!==job)return;
    clearTimeout(this.watchdog);this.busy=null;
    if(this.target?.revision===job.revision) {
      this.target=null;this.metrics.responses++;this.metrics.compiledModules+=result.stats?.compiledModules||0;this.metrics.cacheHits+=result.stats?.cacheHits||0;
      this.onResult({...result,revision:job.revision,mode:this.mode});
    } else this.metrics.discarded++;
    if(this.target&&!this.timer)this.start();this.state();
  }
  stopWorker(){clearTimeout(this.watchdog);this.worker?.terminate();this.worker?.releaseSource?.();this.worker=null;}
  cancel(){this.revision++;this.target=null;this.busy=null;clearTimeout(this.timer);clearTimeout(this.fallbackTimer);this.timer=null;this.stopWorker();this.state();}
  dispose(){if(this.disposed)return;this.cancel();this.disposed=true;this.cache.clear();}
}
