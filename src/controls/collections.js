import { VBError } from '../language/lexer.js';
import { lower } from '../core/core.js';
export class ControlCollection {
  constructor(onChange=()=>{}){this.items=[];this.onChange=onChange;}
  get Count(){return this.items.length;}
  Item(key){const value=typeof key==='number'?this.items[key-1]:this.items.find(item=>lower(item.Key||'')===lower(key));if(!value)throw new VBError('Element not found',35601);return value;}
  index(key){const item=this.Item(key);return this.items.indexOf(item);}
  insert(item,index){if(item.Key&&this.items.some(x=>lower(x.Key||'')===lower(item.Key)))throw new VBError('Key is not unique in collection',35602);if(index===undefined||index===0)this.items.push(item);else this.items.splice(Math.max(0,Number(index)-1),0,item);this.reindex();this.onChange();return item;}
  reindex(){this.items.forEach((item,i)=>item.Index=i+1);}
  Remove(key){this.items.splice(this.index(key),1);this.reindex();this.onChange();}
  Clear(){this.items=[];this.onChange();}
  [Symbol.iterator](){return this.items[Symbol.iterator]();}
}
function observable(item,key,value,onChange){let state=value;Object.defineProperty(item,key,{enumerable:true,configurable:true,get:()=>state,set:v=>{state=v;onChange();}});}
export class TreeNodes extends ControlCollection {
  constructor(onChange,onSelect){super(onChange);this.onSelect=onSelect;}
  Add(relative,relationship=0,key='',text='',image,selectedImage){let parent=null;if(relative!==undefined&&relative!==''){const rel=typeof relative==='object'?relative:this.Item(relative);parent=Number(relationship)===4?rel:rel.Parent;}
    const item={Key:key||'',Index:0,Parent:parent,Tag:'',Image:image,SelectedImage:selectedImage,EnsureVisible:()=>{for(let n=item.Parent;n;n=n.Parent)n.Expanded=-1;this.onSelect?.(item);this.onChange();}};
    observable(item,'Text',String(text||''),this.onChange);observable(item,'Expanded',0,this.onChange);observable(item,'Selected',0,()=>{if(item.Selected)this.onSelect?.(item);this.onChange();});Object.defineProperty(item,'Children',{get:()=>this.items.filter(n=>n.Parent===item).length});Object.defineProperty(item,'Child',{get:()=>this.items.find(n=>n.Parent===item)||null});this.insert(item);return item;
  }
  Remove(key){const item=this.Item(key),remove=new Set([item]);for(let changed=true;changed;){changed=false;for(const n of this.items)if(n.Parent&&remove.has(n.Parent)&&!remove.has(n)){remove.add(n);changed=true;}}this.items=this.items.filter(n=>!remove.has(n));this.reindex();this.onChange();}
  flattened(){const result=[],children=new Map();for(const n of this.items){const key=n.Parent;let list=children.get(key);if(!list)children.set(key,list=[]);list.push(n);}const stack=(children.get(null)||[]).slice().reverse().map(node=>({node,depth:0})),seen=new Set();while(stack.length){const {node,depth}=stack.pop();if(seen.has(node))continue;seen.add(node);const list=children.get(node)||[];result.push({node,depth,children:list.length});if(node.Expanded)for(let i=list.length-1;i>=0;i--)stack.push({node:list[i],depth:depth+1});}return result;}
}
export class ListItems extends ControlCollection {
  constructor(onChange,onSelect){super(onChange);this.onSelect=onSelect;}
  Add(index,key='',text='',icon,smallIcon){const item={Key:key||'',Index:0,Tag:'',Icon:icon,SmallIcon:smallIcon,Checked:0,subItems:[],SubItems(n){return this.subItems[n-1]||'';},setIndexed(name,args,value){if(lower(name)==='subitems'){this.subItems[Number(args[0])-1]=String(value);item.changed();}else throw new VBError('Invalid indexed property',438);},EnsureVisible:()=>this.onSelect?.(item),changed:()=>this.onChange()};observable(item,'Text',String(text||''),this.onChange);observable(item,'Selected',0,()=>{if(item.Selected)this.onSelect?.(item);this.onChange();});return this.insert(item,index);}
}
export class ColumnHeaders extends ControlCollection {Add(index,key='',text='',width=1440,alignment=0){const item={Key:key||'',Index:0,Alignment:alignment};observable(item,'Text',String(text),this.onChange);observable(item,'Width',Number(width),this.onChange);return this.insert(item,index);}}
export class ToolbarButtons extends ControlCollection {Add(index,key='',caption='',style=0,image){const item={Key:key||'',Index:0,Style:style,Image:image,Tag:''};for(const [k,v]of Object.entries({Caption:caption,Enabled:-1,Visible:-1,Value:0,ToolTipText:''}))observable(item,k,v,this.onChange);return this.insert(item,index);}}
export class StatusPanels extends ControlCollection {Add(index,key='',text='',style=0){const item={Key:key||'',Index:0,Style:style};for(const [k,v]of Object.entries({Text:text,Width:1440,Alignment:0,Enabled:-1,Visible:-1}))observable(item,k,v,this.onChange);return this.insert(item,index);}}
export class TabItems extends ControlCollection {Add(index,key='',caption='',image){const item={Key:key||'',Index:0,Image:image,Tag:''};observable(item,'Caption',caption,this.onChange);return this.insert(item,index);}}
export class ImageItems extends ControlCollection {Add(index,key='',picture=''){const item={Key:key||'',Index:0,Picture:picture,Tag:''};return this.insert(item,index);}}
export class ControlArray {
  constructor(load=null,unload=null){this.items=new Map();this.__type='ControlArray';this.load=load;this.unload=unload;}
  Load(index){if(!this.load)throw new VBError('Control array does not support Load',438);return this.load(Number(index));}
  Unload(index){if(!this.unload)throw new VBError('Control array does not support Unload',438);return this.unload(Number(index));}
  Item(index){const item=this.items.get(Number(index));if(!item)throw new VBError('Control array element does not exist',340);return item;}
  get Count(){return this.items.size;}get LBound(){return Math.min(...this.items.keys());}get UBound(){return Math.max(...this.items.keys());}
  [Symbol.iterator](){return [...this.items.entries()].sort((a,b)=>a[0]-b[0]).map(v=>v[1])[Symbol.iterator]();}
}
