/** VB-aware front-end to the native optimizer. Checked arithmetic stays checked. */
import {foldNativeInteger} from './optimizer.js';
const integerTypes=new Set(['byte','integer','long','boolean']);
export const nativeOptimizationMethods={
  optimizedIntegerExpression(node) {
    if(this.optimization<2||!['binary','unary'].includes(node.kind)||!integerTypes.has(this.type(node)))return false;
    const resolve=node=>this.nativeConstant(node),folded=foldNativeInteger(node,resolve);
    if(folded){this.x.value(folded.value);this.optimizationStats.constantsFolded++;return true;}
    if(node.kind!=='binary'||!integerTypes.has(this.type(node.left))||!integerTypes.has(this.type(node.right)))return false;
    const right=foldNativeInteger(node.right,resolve),op=String(node.op).toLowerCase();
    if(!right||!['+','-','*','and','or','xor','=','<>','<','<=','>','>='].includes(op))return false;
    this.numeric(node.left);
    const x=this.x,operation={'+':'add','-':'sub','*':'imul','and':'and','or':'or','xor':'xor'}[op];
    if(operation){if(operation==='imul')x.imul('eax','eax',right.value);else x[operation]('eax',right.value);if(['+','-','*'].includes(op))x.branch('o','error:6');}
    else{x.cmp('eax',right.value);this.boolean(op);}
    this.optimizationStats.immediateOperations++;return true;
  }
};
