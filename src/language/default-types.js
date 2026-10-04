import {VBError} from './lexer.js';
/** VB6 module-scoped default types. Later VB.NET-only integer types are not accepted. */
export const DEFAULT_TYPE_NAMES=Object.freeze({defbool:'Boolean',defbyte:'Byte',defint:'Integer',deflng:'Long',defcur:'Currency',defsng:'Single',defdbl:'Double',defdate:'Date',defstr:'String',defobj:'Object',defvar:'Variant'});
export function addDefaultTypes(table,statement){
  const match=String(statement).match(/^(Def\w+)\s+(.+)$/i),type=match&&DEFAULT_TYPE_NAMES[match[1].toLowerCase()];
  if(!type)throw new VBError('Unsupported default-type declaration',1002);
  const changes=[];
  for(const part of match[2].split(',')){
    const range=part.trim().match(/^([A-Za-z])(?:\s*-\s*([A-Za-z]))?$/);
    if(!range)throw new VBError('Expected a single letter or ascending letter range',1002);
    const a=range[1].toLowerCase().charCodeAt(0),b=(range[2]||range[1]).toLowerCase().charCodeAt(0);
    if(b<a)throw new VBError('Default-type letter range must be ascending',1002);
    for(let c=a;c<=b;c++){const key=String.fromCharCode(c);if(Object.hasOwn(table,key)||changes.includes(key))throw new VBError('Duplicate default-type letter: '+key,1002);changes.push(key);}
  }
  for(const key of changes)table[key]=type;
  return table;
}
export function defaultIdentifierType(name,table={}){
  return ({'$':'String','%':'Integer','&':'Long','!':'Single','#':'Double','@':'Currency'}[String(name).at(-1)]||table[String(name).charAt(0).toLowerCase()]||'Variant');
}
