/** Windows 32-bit .res containers. Payloads remain opaque unless explicitly edited. */
import {VBError} from '../language/lexer.js';
import {cleanProjectPath,fromBase64,toBase64,MAX_RESOURCE_BYTES} from './frx.js';
export const RESOURCE_TYPES=Object.freeze({1:'Cursor',2:'Bitmap',3:'Icon',4:'Menu',5:'Dialog',6:'String',7:'Font directory',8:'Font',9:'Accelerator',10:'Custom data',11:'Message table',12:'Cursor group',14:'Icon group',16:'Version',24:'Manifest'});
export const resourceKey=entry=>JSON.stringify([entry.type,entry.name,entry.language||0]);
const fail=message=>{throw new VBError('RES: '+message,1002);};
const align=n=>Math.ceil(n/4)*4;
function uint(value,bits,label){if(!Number.isInteger(value)||value<0||value>2**bits-1)fail('Invalid '+label);return value;}
function identifier(value){if(typeof value==='number')return uint(value,16,'resource identifier');if(typeof value!=='string'||!value||value.length>1024||value.includes('\0')||value.charCodeAt(0)===65535)fail('Invalid resource name');return value;}
function signature(entry){return JSON.stringify([entry.type,entry.name,entry.language,entry.flags,entry.dataVersion,entry.version,entry.characteristics,entry.data]);}
export function normalizeResources(model){
  if(!model||!Array.isArray(model.entries)||model.entries.length>10000)fail('Expected up to 10,000 resource entries');
  let total=32;const seen=new Set(),entries=model.entries.map(input=>{
    if(!input||typeof input.data!=='string')fail('Missing resource data');
    if(input.data.length>MAX_RESOURCE_BYTES*4/3+4)fail('Resource exceeds 20 MiB');
    const entry={type:identifier(input.type),name:identifier(input.name),language:uint(input.language??0,16,'language'),flags:uint(input.flags??0x30,16,'memory flags'),dataVersion:uint(input.dataVersion??0,32,'data version'),version:uint(input.version??0,32,'version'),characteristics:uint(input.characteristics??0,32,'characteristics'),data:toBase64(fromBase64(input.data))};
    if(entry.type===0&&entry.name===0&&!entry.data)fail('Null resource is a container header, not an entry');
    total+=Math.ceil(entry.data.length*3/4)+64+(typeof entry.type==='string'?entry.type.length*2:0)+(typeof entry.name==='string'?entry.name.length*2:0);if(total>MAX_RESOURCE_BYTES)fail('Resource file exceeds 20 MiB');
    const key=resourceKey(entry);if(seen.has(key))fail('Duplicate resource type, name and language');seen.add(key);return entry;
  });
  const result={fileName:cleanProjectPath(model.fileName||'Project.res'),entries};
  if(!/\.res$/i.test(result.fileName))fail('Resource file name must end in .res');
  if(model.original!==undefined){if(typeof model.original!=='string'||model.original.length>MAX_RESOURCE_BYTES*4/3+4)fail('Invalid original resource file');result.original=model.original;}
  return result;
}
function parse(bytes){
  if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
  if(bytes.length>MAX_RESOURCE_BYTES)fail('Resource file exceeds 20 MiB');
  if(bytes.length<32)fail('Truncated or non-Win32 resource container');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),records=[];let offset=0;
  while(offset<bytes.length){
    if(offset%4||offset+8>bytes.length)fail('Truncated or misaligned header');
    const start=offset,size=view.getUint32(start,true),headerSize=view.getUint32(start+4,true),headerEnd=start+headerSize;
    if(headerSize<24||headerSize%4||headerEnd>bytes.length||size>bytes.length-headerEnd)fail('Invalid resource header or payload bounds');
    let at=start+8;
    const readName=()=>{if(at+2>headerEnd)fail('Truncated identifier');let word=view.getUint16(at,true);at+=2;if(word===65535){if(at+2>headerEnd)fail('Truncated ordinal');word=view.getUint16(at,true);at+=2;return word;}let text='';while(word){text+=String.fromCharCode(word);if(text.length>1024||at+2>headerEnd)fail('Unterminated or oversized name');word=view.getUint16(at,true);at+=2;}return text;};
    const type=readName(),name=readName();at=align(at);if(at+16>headerEnd)fail('Missing fixed header fields');
    const entry={type,name,dataVersion:view.getUint32(at,true),flags:view.getUint16(at+4,true),language:view.getUint16(at+6,true),version:view.getUint32(at+8,true),characteristics:view.getUint32(at+12,true),data:toBase64(bytes.subarray(headerEnd,headerEnd+size))};
    const end=align(headerEnd+size);if(end>bytes.length)fail('Truncated data alignment padding');
    records.push({entry,start,end});if(records.length>10001)fail('More than 10,000 resources');offset=end;
  }
  const prefix=records[0];if(!prefix||prefix.entry.type!==0||prefix.entry.name!==0||prefix.entry.data!=='')fail('Missing Win32 null-resource header');
  return {records:records.slice(1),prefix};
}
export function readRES(bytes,fileName='Project.res'){
  bytes=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const parsed=parse(bytes);
  return normalizeResources({fileName,entries:parsed.records.map(r=>r.entry),original:toBase64(bytes)});
}
function recordBytes(entry){
  const nameLength=value=>typeof value==='number'?4:(value.length+1)*2;
  const fixed=align(8+nameLength(entry.type)+nameLength(entry.name)),headerSize=fixed+16,data=fromBase64(entry.data),out=new Uint8Array(align(headerSize+data.length)),view=new DataView(out.buffer);
  view.setUint32(0,data.length,true);view.setUint32(4,headerSize,true);let at=8;
  for(const value of [entry.type,entry.name]){if(typeof value==='number'){view.setUint16(at,65535,true);view.setUint16(at+2,value,true);at+=4;}else{for(let i=0;i<value.length;i++){view.setUint16(at,value.charCodeAt(i),true);at+=2;}at+=2;}}
  view.setUint32(fixed,entry.dataVersion,true);view.setUint16(fixed+4,entry.flags,true);view.setUint16(fixed+6,entry.language,true);view.setUint32(fixed+8,entry.version,true);view.setUint32(fixed+12,entry.characteristics,true);out.set(data,headerSize);return out;
}
export function writeRES(model){
  model=normalizeResources(model);let original,parsed;
  if(model.original){original=fromBase64(model.original);parsed=parse(original);}
  const old=new Map((parsed?.records||[]).map(r=>[resourceKey(r.entry),r]));
  if(parsed&&parsed.records.length===model.entries.length&&parsed.records.every((r,i)=>signature(r.entry)===signature(model.entries[i])))return original.slice();
  const nullEntry={type:0,name:0,language:0,flags:0,dataVersion:0,version:0,characteristics:0,data:''};
  const chunks=[parsed?original.slice(0,parsed.prefix.end):recordBytes(nullEntry)];
  for(const entry of model.entries){const prior=old.get(resourceKey(entry));chunks.push(prior&&signature(prior.entry)===signature(entry)?original.slice(prior.start,prior.end):recordBytes(entry));}
  const length=chunks.reduce((n,c)=>n+c.length,0);if(length>MAX_RESOURCE_BYTES)fail('Resource file exceeds 20 MiB');const out=new Uint8Array(length);let at=0;for(const chunk of chunks){out.set(chunk,at);at+=chunk.length;}return out;
}
export function decodeStringTable(bytes){
  bytes=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),strings=[];let at=0;
  for(let slot=0;slot<16;slot++){if(at+2>bytes.length)fail('Truncated string-table length');const length=view.getUint16(at,true);at+=2;if(at+length*2>bytes.length)fail('Truncated string-table text');let value='';for(let i=0;i<length;i++)value+=String.fromCharCode(view.getUint16(at+i*2,true));strings.push(value);at+=length*2;}
  if(at!==bytes.length)fail('Trailing bytes in string-table block');return strings;
}
export function encodeStringTable(strings){
  if(!Array.isArray(strings)||strings.length!==16||strings.some(s=>typeof s!=='string'||s.length>65535))fail('Expected sixteen strings, each at most 65,535 UTF-16 code units');
  const bytes=new Uint8Array(32+strings.reduce((n,s)=>n+s.length*2,0)),view=new DataView(bytes.buffer);let at=0;
  for(const s of strings){view.setUint16(at,s.length,true);at+=2;for(let i=0;i<s.length;i++){view.setUint16(at,s.charCodeAt(i),true);at+=2;}}return bytes;
}
/** Pure transactions: validation failure never mutates the source resource model. */
export function setResource(model,entry,{replace=true}={}){
  const next=normalizeResources(model||{entries:[]});entry=normalizeResources({entries:[entry]}).entries[0];const index=next.entries.findIndex(e=>resourceKey(e)===resourceKey(entry));if(index>=0){if(!replace)fail('Resource already exists');next.entries[index]=entry;}else next.entries.push(entry);return normalizeResources(next);
}
export function removeResource(model,key){const next=normalizeResources(model);next.entries=next.entries.filter(e=>resourceKey(e)!==key);return next;}
export function setResourceString(model,id,text,language=0){
  id=uint(id,16,'string ID');language=uint(language,16,'language');if(typeof text!=='string'||text.length>65535)fail('Invalid string value');
  const next=normalizeResources(model||{entries:[]}),name=(id>>4)+1,prior=next.entries.find(e=>e.type===6&&e.name===name&&e.language===language),strings=prior?decodeStringTable(fromBase64(prior.data)):Array(16).fill('');strings[id&15]=text;
  return setResource(next,{...prior,type:6,name,language,data:toBase64(encodeStringTable(strings))});
}
export function listResourceStrings(model){const result=[];for(const entry of model?.entries||[])if(entry.type===6&&Number.isInteger(entry.name)&&entry.name>=1&&entry.name<=4096){const strings=decodeStringTable(fromBase64(entry.data));strings.forEach((text,slot)=>{if(text)result.push({id:(entry.name-1)*16+slot,text,language:entry.language,key:resourceKey(entry)});});}return result;}
