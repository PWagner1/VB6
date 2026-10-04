import {VBError} from '../language/lexer.js';
/** Not a VB exception: Resume Next must not defeat user cancellation. */
export class DebugEvaluationAbort extends VBError {
  constructor(message='Debugger evaluation cancelled',number=18){super(message,number);this.debugEvaluationAbort=true;}
}
export class DebugEvaluationSession {
 constructor(vm,{instructionLimit=100000,timeLimit=5000}={}){
  for(const [value,max,name]of [[instructionLimit,10000000,'instruction limit'],[timeLimit,60000,'time limit']])if(!Number.isInteger(value)||value<1||value>max)throw new VBError('Invalid debugger '+name,5);
  this.vm=vm;this.instructionLimit=instructionLimit;this.timeLimit=timeLimit;this.instructions=0;this.started=performance.now();this.lastYield=this.started;this.dialogs=new Set();this.abortListeners=new Set();this.reason=null;
  this.timer=setTimeout(()=>this.cancel(new DebugEvaluationAbort('Debugger evaluation time limit exceeded',7)),timeLimit);
 }
 cancel(reason=new DebugEvaluationAbort()){
  if(this.reason)return;this.reason=reason;for(const dialog of this.dialogs)dialog.vbFinish?.();
  for(const reject of this.abortListeners)reject(reason);this.abortListeners.clear();
 }
 check(){if(this.reason)throw this.reason;if(performance.now()-this.started>this.timeLimit){this.cancel(new DebugEvaluationAbort('Debugger evaluation time limit exceeded',7));throw this.reason;}}
 async checkpoint(){this.check();if(++this.instructions>this.instructionLimit){this.cancel(new DebugEvaluationAbort('Debugger evaluation instruction limit exceeded',7));throw this.reason;}if(performance.now()-this.lastYield>=this.vm.options.sliceMilliseconds){await new Promise(r=>setTimeout(r,0));this.lastYield=performance.now();this.check();}}
 async wait(value){this.check();if(!value||typeof value.then!=='function')return value;
  return new Promise((resolve,reject)=>{const abort=reason=>reject(reason);this.abortListeners.add(abort);Promise.resolve(value).then(v=>{this.abortListeners.delete(abort);try{this.check();resolve(v);}catch(e){reject(e);}},e=>{this.abortListeners.delete(abort);reject(this.reason||e);});});
 }
 dispose(){clearTimeout(this.timer);this.abortListeners.clear();this.dialogs.clear();}
}
