import {el,clone,download} from '../core/core.js';
import {ToolList} from './virtual-list.js';
import {readRES,writeRES,normalizeResources,resourceKey,RESOURCE_TYPES,listResourceStrings,setResource,setResourceString,removeResource} from '../project/res.js';
import {fromBase64,toBase64,MAX_RESOURCE_BYTES,rasterDataURL} from '../project/frx.js';
import {icon} from './ui.js';
const HEX_LIMIT=65536;
const identity=value=>{const text=value.trim();return /^\d+$/.test(text)?Number(text):/^".*"$/.test(text)?JSON.parse(text):text;};
const showId=value=>typeof value==='number'?String(value):JSON.stringify(value);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ').replace(/((?:[0-9A-F]{2} ){15}[0-9A-F]{2}) /g,'$1\n');
export class ResourceEditor {
  constructor(ide){
    this.ide=ide;this.key='tool:resources';this.title='Resource Editor';this.glyph='properties';this.width=830;this.height=530;this.alive=true;
    this.root=el('div',{class:'resource-editor'});this.status=el('div',{class:'tool-status',role:'status'});
    const button=(label,fn,glyph)=>el('button',{type:'button',onclick:()=>this.guard(fn),'aria-label':label},icon(glyph||'properties',14),label);
    this.fileName=el('span',{class:'resource-file-name'});
    this.importInput=el('input',{type:'file',accept:'.res',hidden:true});this.dataInput=el('input',{type:'file',hidden:true});
    this.root.append(el('div',{class:'object-toolbar resource-toolbar'},button('Add String',()=>this.addString(),'add'),button('Add Data',()=>this.addData(),'add'),button('Import .res…',()=>this.importInput.click(),'open'),button('Export .res…',()=>this.exportFile(),'save'),this.fileName),this.importInput,this.dataInput);
    this.list=new ToolList('Project resources',item=>this.select(item));
    this.id=el('input',{'aria-label':'Resource ID'});this.type=el('input',{'aria-label':'Resource type'});this.language=el('input',{'aria-label':'Resource language',type:'number',min:0,max:65535});
    this.content=el('textarea',{'aria-label':'Resource value',spellcheck:false,wrap:'off'});this.preview=el('img',{alt:'Resource bitmap preview',hidden:true});
    this.apply=button('Apply Resource',()=>this.applyDraft(),'save');this.revert=button('Revert Resource',()=>this.revertDraft(),'undo');this.remove=button('Delete Resource',()=>this.deleteSelected(),'delete');this.load=button('Load Data…',()=>this.dataInput.click(),'open');this.save=button('Export Data…',()=>this.exportData(),'save');
    this.description=el('div',{class:'tool-note'});
    const right=el('section',{class:'resource-edit-pane'},el('div',{class:'resource-fields'},el('label',{},'ID:',this.id),el('label',{},'Type:',this.type),el('label',{},'Language:',this.language)),this.description,this.content,this.preview,el('div',{class:'resource-actions'},this.apply,this.revert,this.remove,this.load,this.save));
    this.root.append(el('div',{class:'resource-columns'},el('section',{class:'resource-tree'},el('div',{class:'tool-section-label'},'Resources'),this.list.root),right),this.status);
    for(const input of [this.id,this.type,this.language,this.content])input.addEventListener('input',()=>{this.dirty=true;this.status.textContent='Resource draft modified. Apply or Revert before selecting another entry.';});
    this.root.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();event.stopPropagation();this.guard(()=>this.applyDraft());}if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())&&event.target.matches('input,textarea'))event.stopPropagation();});
    this.root.addEventListener('dragover',e=>e.stopPropagation());this.root.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();});
    this.importInput.addEventListener('change',()=>this.readFile(this.importInput,'res'));this.dataInput.addEventListener('change',()=>this.readFile(this.dataInput,'data'));
  }
  guard(fn){try{const result=fn();if(result?.catch)result.catch(e=>this.error(e));return result;}catch(e){this.error(e);}}
  error(error){if(this.alive)this.status.textContent=error.message;}
  model(){return this.ide.project.resources||{fileName:this.ide.project.name+'.res',entries:[]};}
  token(){return JSON.stringify(this.model());}
  writable(){if(this.ide.runState!=='design')throw new Error('Stop execution before editing resources.');if(!this.alive)throw new Error('Resource Editor has been closed.');}
  fresh(){this.writable();if(this.snapshot!==this.token()||this.projectId!==this.ide.project.id)throw new Error('Resources changed outside this draft. Revert before editing.');}
  clean(){this.fresh();if(this.dirty)throw new Error('Apply or Revert the current resource draft first.');}
  refresh(force=false,selectedKey=this.selected?.key){
    const token=this.token();this.fileName.textContent=this.model().fileName;
    if(!force&&token===this.snapshot&&this.projectId===this.ide.project.id)return;
    if(this.dirty&&!force){this.status.textContent='Resources changed outside this draft. Revert to load the current resource file.';return;}
    this.snapshot=token;this.projectId=this.ide.project.id;
    const malformed=new Set(),validEntries=this.model().entries.filter(entry=>{try{listResourceStrings({entries:[entry]});return true;}catch{malformed.add(resourceKey(entry));return false;}});
    const strings=listResourceStrings({entries:validEntries}).map(s=>({...s,kind:'string',key:'string:'+s.id+':'+s.language,label:'String '+s.id+' ['+s.language+']  '+s.text.slice(0,80).replace(/\s/g,' ')}));
    const binary=this.model().entries.filter(e=>e.type!==6||typeof e.name!=='number'||e.name<1||e.name>4096||malformed.has(resourceKey(e))).map(e=>({kind:'data',entry:e,key:resourceKey(e),label:(malformed.has(resourceKey(e))?'Opaque string table':RESOURCE_TYPES[e.type]||showId(e.type))+' '+showId(e.name)+' ['+e.language+']'}));
    this.list.set([...strings,...binary],selectedKey);this.status.textContent=this.model().entries.length+' resource records · '+strings.length+' strings · '+binary.length+' binary records';
  }
  select(item){if(this.dirty){const old=this.list.items.findIndex(i=>i.key===this.selected?.key);if(old>=0)this.list.select(old,false);this.status.textContent='Apply or Revert the resource draft before changing selection.';return;}this.selected=item;this.loadDraft();}
  loadDraft(){const item=this.selected;this.dirty=false;this.content.classList.toggle('resource-hex',item?.kind==='data');this.preview.hidden=true;this.preview.removeAttribute('src');
    this.id.value=item?showId(item.kind==='string'?item.id:item.entry.name):'';this.type.value=item?item.kind==='string'?'6':showId(item.entry.type):'';this.type.disabled=!item||item.kind==='string';this.language.value=item?(item.kind==='string'?item.language:item.entry.language):'0';
    this.content.value='';this.content.readOnly=false;this.description.textContent='Select a resource, or add a string or custom binary resource.';
    if(item?.kind==='string'){this.content.value=item.text;this.description.textContent='Unicode string. ID 0–65535. Language is a Windows LANGID (0 means neutral).';}
    if(item?.kind==='data'){const bytes=fromBase64(item.entry.data);this.content.value=hex(bytes.subarray(0,HEX_LIMIT));this.content.readOnly=bytes.length>HEX_LIMIT;this.description.textContent=bytes.length+' bytes. '+(bytes.length>HEX_LIMIT?'Preview is limited to 64 KiB; import a file to replace the whole value.':'Edit hexadecimal byte pairs separated by spaces or newlines.');if(item.entry.type===2){const source=rasterDataURL(bytes);if(source){this.preview.src=source;this.preview.hidden=false;}}}
    for(const control of [this.id,this.language,this.content,this.apply,this.revert,this.remove,this.save])control.disabled=!item;this.load.disabled=item?.kind!=='data';
  }
  commit(next,label,key){this.fresh();const before=clone(this.ide.project);this.ide.project.resources=normalizeResources(next);this.dirty=false;this.ide.record(before,label);this.refresh(true,key);}
  applyDraft(){this.fresh();const item=this.selected;if(!item)return;const language=Number(this.language.value),name=identity(this.id.value);let model=this.model(),key;
    if(item.kind==='string'){
      if(typeof name!=='number')throw new Error('String IDs must be integers from 0 to 65535.');
      if(name!==item.id||language!==item.language){if(listResourceStrings(model).some(s=>s.id===name&&s.language===language))throw new Error('A string already uses this ID and language.');model=setResourceString(model,item.id,'',item.language);}
      model=setResourceString(model,name,this.content.value,language);key='string:'+name+':'+language;
    }else{
      const type=identity(this.type.value),entry={...item.entry,type,name,language};if(type===6)throw new Error('Use Add String to create or edit string-table resources.');
      if(!this.content.readOnly){const text=this.content.value.trim();if(text&&!/^(?:[\da-f]{2})(?:\s+[\da-f]{2})*$/i.test(text))throw new Error('Data must contain hexadecimal byte pairs separated by whitespace.');const pairs=text?text.split(/\s+/):[];if(pairs.length>HEX_LIMIT)throw new Error('Hex editor is limited to 64 KiB. Use Load Data for larger resources.');entry.data=toBase64(Uint8Array.from(pairs,p=>parseInt(p,16)));}
      key=resourceKey(entry);if(key!==item.key&&model.entries.some(e=>resourceKey(e)===key))throw new Error('A resource already uses this type, ID and language.');model=setResource(removeResource(model,item.key),entry);
    }
    this.commit(model,'Edit resource',key);
  }
  revertDraft(){this.dirty=false;this.refresh(true);}
  addString(){this.clean();const strings=listResourceStrings(this.model());let id=101;while(strings.some(s=>s.id===id&&s.language===0))id++;this.commit(setResourceString(this.model(),id,'New string'), 'Add resource string','string:'+id+':0');}
  addData(){this.clean();let name=101;while(this.model().entries.some(e=>e.type===10&&e.name===name&&e.language===0))name++;const entry={type:10,name,language:0,data:''};this.commit(setResource(this.model(),entry),'Add binary resource',resourceKey(entry));}
  deleteSelected(){this.clean();if(!this.selected)return;const s=this.selected;this.commit(s.kind==='string'?setResourceString(this.model(),s.id,'',s.language):removeResource(this.model(),s.key),'Delete resource');}
  exportFile(){if(this.dirty)throw new Error('Apply or Revert edits before exporting.');download(this.model().fileName.split('/').at(-1),writeRES(this.model()));this.status.textContent='Native .res exported.';}
  exportData(){const s=this.selected;if(!s)return;download(s.kind==='string'?'String-'+s.id+'.txt':'Resource-'+String(s.entry.name).replace(/[^\w-]/g,'_')+'.bin',s.kind==='string'?s.text:fromBase64(s.entry.data),s.kind==='string'?'text/plain;charset=utf-8':'application/octet-stream');}
  async readFile(input,kind){const file=input.files?.[0];input.value='';if(!file)return;const token=this.token(),project=this.ide.project.id,selected=this.selected?.key;
    try{this.clean();if(file.size>MAX_RESOURCE_BYTES)throw new Error('Resource import is limited to 20 MiB.');const bytes=new Uint8Array(await file.arrayBuffer());this.clean();if(project!==this.ide.project.id||token!==this.token()||kind==='data'&&selected!==this.selected?.key)throw new Error('Project or selection changed during resource import.');
      if(kind==='res')this.commit(readRES(bytes,file.name),'Import native resource file');else{if(this.selected?.kind!=='data')throw new Error('Select a binary resource.');this.commit(setResource(this.model(),{...this.selected.entry,data:toBase64(bytes)}),'Import resource data',this.selected.key);}
    }catch(error){this.error(error);}
  }
  dispose(){this.alive=false;this.list.dispose();}
}
export function installResourceEditor(ide){
  const menu=ide.menu.bind(ide),command=ide.command.bind(ide);
  ide.openResourceEditor=()=>{let tool=ide.documents.tools.get('tool:resources');if(!tool)tool=new ResourceEditor(ide);ide.documents.openTool(tool);return tool;};
  ide.menu=name=>{const items=menu(name);if(name==='Tools')items.unshift({label:'Resource Editor',id:'resourceEditor',icon:'properties'},null);return items;};
  ide.command=(id,...args)=>id==='resourceEditor'?ide.openResourceEditor():command(id,...args);
}
