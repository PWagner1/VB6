import {VBError} from '../language/lexer.js';
import {VBArray,bankersRound,numeric} from './values.js';
import {normalizeResources,decodeStringTable} from '../project/res.js';
import {fromBase64,rasterDataURL,toBase64,MAX_RESOURCE_BYTES} from '../project/frx.js';
const ordinal=value=>{if(typeof value==='string')return value;const n=bankersRound(numeric(value));if(n<0||n>65535)throw new VBError('Invalid resource identifier',5);return n;};
/** Immutable resource snapshot. Language lookup: chosen language, neutral, then file order. */
export class ResourceStore {
  constructor(model,language=0){this.model=normalizeResources(model||{entries:[]});this.language=Number(language)||0;this.index=new Map();this.byteCache=new WeakMap();for(const entry of this.model.entries){const key=JSON.stringify([entry.type,entry.name]),items=this.index.get(key)||[];items.push(entry);this.index.set(key,items);}}
  find(name,type,language=this.language){name=ordinal(name);type=ordinal(type);const items=this.index.get(JSON.stringify([type,name]))||[];const entry=items.find(e=>e.language===language)||items.find(e=>e.language===0)||items[0];if(!entry)throw new VBError('Resource with identifier '+name+' not found',326);return entry;}
  bytes(entry){if(!this.byteCache.has(entry))this.byteCache.set(entry,fromBase64(entry.data));return this.byteCache.get(entry);}
  data(name,type){const data=this.bytes(this.find(name,type)),array=VBArray.from(data);array.type='Byte';return array;}
  string(id){id=ordinal(id);if(typeof id!=='number')throw new VBError('Type mismatch',13);const entry=this.find((id>>4)+1,6);return decodeStringTable(this.bytes(entry))[id&15];}
  picture(name,format=0){
    format=bankersRound(numeric(format));if(format<0||format>2)throw new VBError('Invalid picture resource format',5);
    if(format===0){const source=rasterDataURL(this.bytes(this.find(name,2)));if(!source)throw new VBError('Invalid bitmap resource',481);return source;}
    if(format===2)throw new VBError('Native cursor resource rendering is not implemented',481);
    const group=this.find(name,14),bytes=this.bytes(group),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(bytes.length<6||view.getUint16(0,true)!==0||view.getUint16(2,true)!==1)throw new VBError('Invalid icon group',481);
    const count=view.getUint16(4,true);if(!count||count>256||bytes.length!==6+count*14)throw new VBError('Invalid icon group size',481);
    const images=[];let total=6+count*16;
    for(let i=0;i<count;i++){const at=6+i*14,id=view.getUint16(at+12,true),image=this.bytes(this.find(id,3,group.language));if(image.length!==view.getUint32(at+8,true))throw new VBError('Invalid icon image size',481);images.push(image);total+=image.length;if(total>MAX_RESOURCE_BYTES)throw new VBError('Icon exceeds resource limit',7);}
    const out=new Uint8Array(total),header=new DataView(out.buffer);header.setUint16(2,1,true);header.setUint16(4,count,true);let offset=6+count*16;
    images.forEach((image,i)=>{const source=6+i*14,at=6+i*16;out.set(bytes.subarray(source,source+12),at);header.setUint32(at+12,offset,true);out.set(image,offset);offset+=image.length;});return 'data:image/x-icon;base64,'+toBase64(out);
  }
}
