// Temporary exact-match application; removed before final review.
import fs from 'node:fs';
function replace(path,before,after){const source=fs.readFileSync(path,'utf8');if(source.includes(after))return;if(source.split(before).length!==2)throw new Error('Source moved; review '+path);fs.writeFileSync(path,source.replace(before,after));}
replace('src/editor/editor.js',"this.selectedObject='(General)';this.assignSource","if(changed){this.selectedObject='(General)';this.objectEntries=null;this.objectSignature=null;}this.assignSource");
replace('src/editor/editor.js',"if(includeObjects){const value=this.selectedObject||'(General)';this.objects.replaceChildren(el('option',{value:'(General)'},'(General)'),...(this.module.form?[el('option',{value:'Form'},'Form'),...this.module.form.controls.map(c=>el('option',{value:c.name},c.name))]:[]));this.objects.value=value;}","if(includeObjects)this.refreshObjects(false);");
replace('src/editor/editor.js','  updateSelectors(includeObjects=true,force=false){',`  // Form-only edits do not replace source buffers, caret positions, or split-pane state.
  refreshObjects(refreshEvents=true){
    if(!this.module)return false;
    const entries=[{id:'$general',name:'(General)',type:''}],names=new Set();
    if(this.module.form){
      entries.push({id:'$form',name:'Form',type:this.module.form.type});
      for(const control of this.module.form.controls){
        const name=lower(control.name);if(names.has(name))continue;names.add(name);
        entries.push({id:control.id,name:control.name,type:control.type,index:control.properties.Index});
      }
    }
    const signature=JSON.stringify(entries);if(signature===this.objectSignature){this.objects.value=this.selectedObject||'(General)';return false;}
    const selected=this.selectedObject||'(General)',previous=this.objectEntries?.find(entry=>lower(entry.name)===lower(selected));
    const current=entries.find(entry=>entry.id===previous?.id)||entries.find(entry=>lower(entry.name)===lower(selected));
    this.selectedObject=current?.name||'(General)';this.objectEntries=entries;this.objectSignature=signature;
    this.objects.replaceChildren(...entries.map(entry=>el('option',{value:entry.name},entry.name)));
    this.objects.value=this.selectedObject;
    if(refreshEvents)this.updateSelectors(false,true);
    return true;
  }
  updateSelectors(includeObjects=true,force=false){`);
replace('src/ide/documents.js','ide.record(before,change.label,false);ide.inspector.render();','ide.record(before,change.label,false);this.editors.get(module.id)?.refreshObjects();ide.inspector.render();');
replace('src/ide/documents.js','if(editor.module!==module||editor.text!==module.code)editor.setDocument(module,ide.project);','if(editor.module!==module||editor.text!==module.code)editor.setDocument(module,ide.project);else editor.refreshObjects();');
