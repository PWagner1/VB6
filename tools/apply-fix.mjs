// Temporary, exact-match source application for this isolated fix branch.
// Removed with its branch-only build workflow before final review and merge.
import fs from 'node:fs';
const path='src/designer/designer.js';
const before="this.formView.controls.forEach((c,i)=>c.node.style.zIndex=String(i+1));";
const after="this.formView.controls.forEach((c,i)=>{c.node.style.zIndex=String(i+1);c.node.style.pointerEvents='auto';});";
const source=fs.readFileSync(path,'utf8');
if(!source.includes(after)){
  if(source.split(before).length!==2)throw new Error('Designer source moved; manual review required.');
  fs.writeFileSync(path,source.replace(before,after));
}
