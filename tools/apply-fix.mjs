// Temporary exact-match application; removed before final review.
import fs from 'node:fs';
function replace(path,before,after){const source=fs.readFileSync(path,'utf8');if(source.includes(after))return;if(source.split(before).length!==2)throw new Error('Source moved; review '+path);fs.writeFileSync(path,source.replace(before,after));}
replace('src/editor/editor.js',"this.procedures.addEventListener('change',()=>{if(this.procedures.value.startsWith('event:')){this.emit('event',{object:this.objects.value,event:this.procedures.value.slice(6)});return;}if(!this.procedures.value&&this.activePane.mode==='procedure'){this.activePane.explicitDeclarations=true;this.syncPane(this.activePane,0);this.input.focus();this.cursorChanged();}else this.goToLine(Number(this.procedures.value)||1);});","this.procedures.addEventListener('change',()=>this.activateProcedure());this.procedures.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();this.activateProcedure();}});");
replace('src/editor/editor.js','  get input(){',`  activateProcedure(){
    if(this.procedures.selectedIndex<0){
      // A Timer has one event: Enter must work without a prior selection change.
      if(this.objects.value==='(General)'||this.procedures.options.length!==1)return;
      this.procedures.selectedIndex=0;
    }
    const value=this.procedures.value;
    if(value.startsWith('event:')){
      if(!this.readOnly)this.emit('event',{object:this.objects.value,event:value.slice(6)});
      return;
    }
    if(!value&&this.activePane.mode==='procedure'){
      this.activePane.explicitDeclarations=true;this.syncPane(this.activePane,0);this.input.focus();this.cursorChanged();
    }else this.goToLine(Number(value)||1);
  }
  get input(){`);
replace('src/editor/editor.js','const options=[...new Set(events)].sort().map(event=>{',"const previousEvent=this.eventObject===selected?this.procedures.selectedOptions[0]?.dataset.event:null;\n      const options=[...new Set(events)].sort().map(event=>{");
replace('src/editor/editor.js',"el('option',{value:existing?existing.line:'event:'+event},event+(existing?'':' '))","el('option',{value:existing?existing.line:'event:'+event,'data-event':event},event+(existing?'':' '))");
replace('src/editor/editor.js','this.procedures.replaceChildren(...options);return;',"this.procedures.replaceChildren(...options);this.eventObject=selected;\n      // Native selects otherwise preselect their only item and never emit change.\n      this.procedures.selectedIndex=previousEvent?options.findIndex(option=>option.dataset.event===previousEvent):-1;return;");
replace('src/ide/documents.js',"    value.on('cursor',c=>","    value.on('event',({object,event})=>{if(ide.runState!=='design'||value.readOnly)return;ide.openDocument(module.id,'code');ide.ensureEvent(object,event);});\n    value.on('cursor',c=>");
