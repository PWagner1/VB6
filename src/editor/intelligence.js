import {lower} from '../core/core.js';
import {KEYWORDS,BUILTINS} from './language-service.js';
import {BUILTIN_SIGNATURES} from '../runtime/signatures.js';
import {VB_CONSTANTS} from '../runtime/library.js';
import {CONTROL_DEFAULTS,createControl,createForm} from '../project/model.js';

/** A tolerant declaration index: does not execute or compile incomplete code. */
export function maskSource(source){
  let out='',string=false,comment=false,date=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='\n'){out+='\n';comment=false;continue;}
    if(comment){out+=' ';continue;}
    if(string){out+=' ';if(c==='"'){if(source[i+1]==='"'){out+=' ';i++;}else string=false;}continue;}
    if(date){out+=' ';if(c==='#')date=false;continue;}
    if(c==='"'){string=true;out+=' ';continue;}
    if(c==="'"||(c==='r'||c==='R')&&/^Rem(?:\s|$)/i.test(source.slice(i))&&(i===0||/[\s:]/.test(source[i-1]))){comment=true;out+=' ';continue;}
    if(c==='#'&&source.indexOf('#',i+1)>=0){date=true;out+=' ';continue;}
    out+=c;
  }
  return out;
}
export function splitArguments(source){
  const masked=maskSource(source);let depth=0,start=0,result=[];
  for(let i=0;i<masked.length;i++){if(masked[i]==='(')depth++;if(masked[i]===')')depth--;if(masked[i]===','&&depth===0){result.push(source.slice(start,i).trim());start=i+1;}}
  if(source.slice(start).trim())result.push(source.slice(start).trim());return result;
}
const typesBySuffix={'%':'Integer','&':'Long','!':'Single','#':'Double','@':'Currency','$':'String'};
function parseVariable(text,line,moduleId,owner=null,scope='private',kind='variable'){
  const clean=text.replace(/^\s*(?:(?:ByVal|ByRef|Optional|ParamArray|WithEvents|Static)\s+)*/i,'');
  const m=clean.match(/^([A-Za-z_]\w*[$%&!#@]?)(\s*\([^)]*\))?\s*(?:As\s+(?:New\s+)?([\w.]+))?/i);if(!m)return null;
  return {name:m[1],type:m[3]||typesBySuffix[m[1].slice(-1)]||'Variant',array:!!m[2],line,moduleId,owner,scope,kind,signature:text.trim(),optional:/^\s*Optional\b/i.test(text)};
}
export function scanDeclarations(module){
  const lines=module.code.split('\n'),masked=maskSource(module.code).split('\n'),symbols=[],procedures=[],records=[];let owner=null,record=null;
  for(let i=0;i<lines.length;i++){
    let text=lines[i],clean=masked[i],line=i+1;
    while(/_\s*$/.test(clean)&&i+1<lines.length){text=text.replace(/_\s*$/,' ')+lines[++i];clean=clean.replace(/_\s*$/,' ')+masked[i];}
    const proc=clean.match(/^\s*(?:(Public|Private|Friend|Static)\s+)*(Sub|Function|Property\s+(?:Get|Let|Set))\s+(\w+[$%&!#@]?)\s*(?:\((.*)\))?\s*(?:As\s+([\w.]+))?/i);
    if(proc){const scope=/^\s*Private\b/i.test(clean)?'private':/^\s*Friend\b/i.test(clean)?'friend':'public';owner={name:proc[3],kind:proc[2].toLowerCase(),line,end:lines.length,moduleId:module.id,scope,type:proc[5]||typesBySuffix[proc[3].slice(-1)]||'Variant',signature:text.trim(),params:[]};const open=text.indexOf('('),close=text.lastIndexOf(')');owner.params=open<0?[]:splitArguments(text.slice(open+1,close));procedures.push(owner);symbols.push(owner);for(const p of owner.params){const variable=parseVariable(p,line,module.id,owner.name,'private','parameter');if(variable)symbols.push(variable);}continue;}
    if(/^\s*End\s+(Sub|Function|Property)\b/i.test(clean)){if(owner)owner.end=line;owner=null;continue;}
    const recordStart=clean.match(/^\s*(?:(Public|Private)\s+)?(Type|Enum)\s+(\w+)/i);
    if(recordStart){record={name:recordStart[3],kind:recordStart[2].toLowerCase(),scope:lower(recordStart[1]||'public'),line,moduleId:module.id,members:[]};records.push(record);symbols.push(record);continue;}
    if(/^\s*End\s+(Type|Enum)\b/i.test(clean)){record=null;continue;}
    if(record){const value=parseVariable(text,line,module.id,null,record.scope,record.kind==='enum'?'constant':'field');if(value){value.parentType=record.name;value.signature=record.name+'.'+text.trim();record.members.push(value);if(record.kind==='enum')symbols.push(value);}continue;}
    const decl=clean.match(/^\s*(Dim|Private|Public|Friend|Static|Const)\s+(?:(Const)\s+)?(.*)/i);
    if(decl){const original=text.slice(text.length-decl[3].length),scope=/^(Public|Friend)$/i.test(decl[1])?lower(decl[1]):'private';for(const p of splitArguments(original)){const value=parseVariable(p,line,module.id,owner?.name||null,scope,lower(decl[1])==='const'||decl[2]?'constant':'variable');if(value)symbols.push(value);}}
  }
  for(const control of module.form?.controls||[])symbols.push({name:control.name,type:control.type,kind:'control',scope:'public',line:1,moduleId:module.id,array:control.properties.Index!==undefined,signature:control.name+' As '+control.type});
  return {moduleId:module.id,name:module.name,symbols,procedures,records};
}
const controlMembers=new Map();
const commonMethods={Move:'Left, Top?, Width?, Height?',SetFocus:'',Refresh:'',ZOrder:'Position?'};
const specificMethods={Form:{Show:'Modal?, Owner?',Hide:'',Print:'OutputList',Cls:'',Unload:''},ListBox:{AddItem:'Item, Index?',RemoveItem:'Index',Clear:''},ComboBox:{AddItem:'Item, Index?',RemoveItem:'Index',Clear:''},PictureBox:{Cls:'',Print:'OutputList',PSet:'X, Y, Color?'},RichTextBox:{LoadFile:'FileName, FileType?',SaveFile:'FileName, FileType?',Find:'String, Start?, End?, Options?'},CommonDialog:{ShowOpen:'',ShowSave:'',ShowColor:'',ShowFont:''}};
function adapterMembers(type){
  type=type.replace(/^VB\./i,'');if(controlMembers.has(type))return controlMembers.get(type);
  const result=[];
  if(type==='Form'||Object.hasOwn(CONTROL_DEFAULTS,type)){
    const props=type==='Form'?createForm().form.properties:createControl(type).properties;
    for(const [name,value]of Object.entries(props))result.push({name,kind:'property',type:typeof value==='number'?'Long':'String',signature:name+' As '+(typeof value==='number'?'Long':'String')});
    for(const [name,args]of Object.entries({...commonMethods,...specificMethods[type]}))result.push({name,kind:'method',signature:name+'('+args+')',params:args?args.split(',').map(s=>s.trim()):[]});
    if(['TextBox','RichTextBox'].includes(type))for(const name of ['SelStart','SelLength','SelText'])result.push({name,kind:'property',type:name==='SelText'?'String':'Long',signature:name+' As '+(name==='SelText'?'String':'Long')});
  }else if(/^(?:Scripting\.)?Dictionary$/i.test(type)){
    for(const [name,args]of Object.entries({Add:'Key, Item',Item:'Key',Exists:'Key',Keys:'',Items:'',Remove:'Key',RemoveAll:''}))result.push({name,kind:'method',signature:name+'('+args+')',params:args?args.split(', '):[]});
    result.push({name:'Count',kind:'property',type:'Long',signature:'Count As Long'},{name:'CompareMode',kind:'property',type:'Long',signature:'CompareMode As Long'});
  }else if(/^Collection$/i.test(type))for(const [name,args]of Object.entries({Add:'Item, Key?, Before?, After?',Item:'Index',Remove:'Index',Count:''}))result.push({name,kind:name==='Count'?'property':'method',signature:name+'('+args+')',params:args?args.split(', '):[]});
  controlMembers.set(type,result);return result;
}

export function wordAt(text,offset){let start=offset,end=offset;while(start>0&&/[\w.$%&!#@]/.test(text[start-1]))start--;while(end<text.length&&/[\w$%&!#@]/.test(text[end]))end++;return {start,end,text:text.slice(start,end)};}
/** Locate nested calls, ignoring commas in strings, dates and nested expressions. */
export function callContext(text,offset,{outer=false}={}){
  let start=text.lastIndexOf('\n',offset-1)+1;
  // Join VB explicit line continuations without losing source offsets.
  while(start>0){const previous=text.lastIndexOf('\n',start-2)+1;if(!/_\s*$/.test(text.slice(previous,start-1)))break;start=previous;}
  const original=text.slice(start,offset),masked=maskSource(original),stack=[];
  for(let i=0;i<masked.length;i++){const c=masked[i];if(c==='('){const match=masked.slice(0,i).match(/([A-Za-z_][\w.$]*)\s*$/);stack.push({name:match?.[1]||'',start:start+i+1,comma:0,last:i+1});}else if(c===')')stack.pop();else if(c===','&&stack.length){stack.at(-1).comma++;stack.at(-1).last=i+1;}}
  let found=(outer?stack.find(c=>c.name):[...stack].reverse().find(c=>c.name));
  if(!found){const m=masked.match(/^\s*(?:Call\s+)?([A-Za-z_][\w.$]*)\s+(?![=])(.*)$/i);if(!m||KEYWORDS.some(k=>lower(k)===lower(m[1])))return null;const at=masked.indexOf(m[2]);let depth=0,comma=0,last=at;for(let i=at;i<masked.length;i++){if(masked[i]==='(')depth++;else if(masked[i]===')')depth--;else if(masked[i]===','&&!depth){comma++;last=i+1;}}found={name:m[1],start:start+at,comma,last};}
  const named=masked.slice(found.last).replace(/_\s*\n/g,' ').match(/^\s*([A-Za-z_]\w*)\s*:=/);return {...found,named:named?.[1]||null};
}

export class EditorIntelligence {
  constructor(){this.cache=new Map();this.scanCount=0;}
  index(module){const cached=this.cache.get(module.id),formKey=JSON.stringify((module.form?.controls||[]).map(c=>[c.name,c.type,c.properties.Index]));if(cached?.code===module.code&&cached.name===module.name&&cached.kind===module.kind&&cached.formKey===formKey)return cached.index;const index=scanDeclarations(module);this.scanCount++;this.cache.set(module.id,{code:module.code,name:module.name,kind:module.kind,formKey,index});return index;}
  prune(project){const ids=new Set(project.modules.map(m=>m.id));for(const id of this.cache.keys())if(!ids.has(id))this.cache.delete(id);}
  scope(project,module,line){this.prune(project);const idx=this.index(module),proc=idx.procedures.find(p=>line>=p.line&&line<=p.end);return {idx,proc,symbols:idx.symbols.filter(s=>!s.owner||lower(s.owner)===lower(proc?.name))};}
  resolve(project,module,line,expression){
    const parts=expression.split('.').filter(Boolean);if(!parts.length)return null;
    const {idx,proc,symbols}=this.scope(project,module,line);let first=parts.shift(),result;
    if(lower(first)==='me')result={name:'Me',type:module.name,moduleId:module.id,kind:'variable'};
    else result=symbols.find(s=>s.owner&&lower(s.name)===lower(first))||symbols.find(s=>!s.owner&&lower(s.name)===lower(first));
    if(!result){const target=project.modules.find(m=>lower(m.name)===lower(first));if(target)result={name:target.name,type:target.name,moduleId:target.id,kind:'module',line:1};}
    if(!result)for(const other of project.modules){if(other.kind!=='module'||other.id===module.id)continue;result=this.index(other).symbols.find(s=>!s.owner&&s.scope!=='private'&&lower(s.name)===lower(first));if(result)break;}
    if(!result){const name=Object.keys(BUILTIN_SIGNATURES).find(k=>lower(k)===lower(first));if(name)result={name,kind:'function',signature:name+'('+BUILTIN_SIGNATURES[name].replaceAll(',',', ')+')',params:BUILTIN_SIGNATURES[name]?BUILTIN_SIGNATURES[name].split(','):[]};}
    if(!result){const name=Object.keys(VB_CONSTANTS).find(k=>lower(k)===lower(first));if(name)result={name,kind:'constant',signature:name+' = '+JSON.stringify(VB_CONSTANTS[name])};}
    if(!result)return null;
    for(const part of parts){const members=this.members(project,module,result.type||result.name);result=members.find(s=>lower(s.name)===lower(part));if(!result)return null;}
    return result;
  }
  members(project,module,type){
    const target=project.modules.find(m=>lower(m.name)===lower(type));if(target){const result=this.index(target).symbols.filter(s=>!s.owner&&(target.id===module.id||s.scope!=='private'));return target.form?result.concat(adapterMembers('Form')):result;}
    for(const m of project.modules){const record=this.index(m).records.find(r=>lower(r.name)===lower(type)&&(m.id===module.id||r.scope!=='private'));if(record)return record.members;}
    return adapterMembers(type||'Variant');
  }
  completions(project,module,line,text,offset,{constants=false,unfiltered=false}={}){
    const before=text.slice(0,offset),word=before.match(/[A-Za-z_]\w*[$%&!#@]?$/)?.[0]||'',prefix=lower(word),left=before.slice(0,before.length-word.length),member=left.match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\.$/);
    // Inside a literal/comment there is no meaningful identifier completion.
    const lineText=before.slice(before.lastIndexOf('\n')+1),masked=maskSource(lineText);
    if(word&&masked.slice(-word.length).trim()==='')return {start:offset-word.length,items:[]};
    let items=[];
    if(constants){items=Object.entries(VB_CONSTANTS).map(([name,value])=>({name,kind:'constant',signature:name+' = '+JSON.stringify(value)}));for(const m of project.modules)items.push(...this.index(m).symbols.filter(s=>s.kind==='constant'&&(s.scope!=='private'||m.id===module.id)&&(!s.owner||m.id===module.id&&lower(s.owner)===lower(this.scope(project,module,line).proc?.name))));}
    else if(member){const object=this.resolve(project,module,line,member[1]);items=object?this.members(project,module,object.type||object.name):[];}
    else {items=this.scope(project,module,line).symbols.slice();for(const other of project.modules){items.push({name:other.name,kind:'module',type:other.name,moduleId:other.id,line:1});if(other.kind==='module'&&other.id!==module.id)items.push(...this.index(other).symbols.filter(s=>!s.owner&&s.scope!=='private'));}items.push(...KEYWORDS.map(name=>({name,kind:'keyword'})),...BUILTINS.map(name=>({name,kind:'function'})),...Object.keys(VB_CONSTANTS).map(name=>({name,kind:'constant'})));}
    const unique=new Map();for(const item of items){const key=lower(item.name);if((unfiltered||key.startsWith(prefix))&&!unique.has(key))unique.set(key,item);}
    return {start:offset-word.length,items:[...unique.values()].sort((a,b)=>lower(a.name).localeCompare(lower(b.name)))};
  }
  parameterInfo(project,module,line,text,offset,options){const context=callContext(text,offset,options);if(!context)return null;const symbol=this.resolve(project,module,line,context.name);if(!symbol?.params)return null;let active=context.comma;if(context.named){const index=symbol.params.findIndex(p=>lower(p.replace(/^(?:(?:Optional|ByVal|ByRef|ParamArray)\s+)*/i,'').match(/^\w+/)?.[0]||'')===lower(context.named));if(index>=0)active=index;}return {...symbol,active,context};}
}
