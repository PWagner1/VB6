import { VBError } from './lexer.js';
import { parseExpression } from './expression.js';
import { binary, unary, truth } from '../runtime/values.js';

/** Conditional compilation is resolved before lexing; removed lines remain blank. */
export function preprocess(source, constants = {}, sourceName = '') {
  const values = new Map(Object.entries({VBWEB:-1, VBA7:0, Win32:0, Win64:0, Mac:0, ...constants}).map(([k,v])=>[k.toLowerCase(),v]));
  const frames=[];
  const enabled=()=>frames.every(f=>f.active);
  const evaluate=node=>{
    if(node.kind==='literal')return node.value;
    if(node.kind==='empty')return undefined;
    if(node.kind==='id')return values.get(node.name.toLowerCase());
    if(node.kind==='group')return evaluate(node.expr);
    if(node.kind==='unary')return unary(node.op,evaluate(node.expr));
    if(node.kind==='binary')return binary(node.op,evaluate(node.left),evaluate(node.right));
    throw new VBError('Conditional expressions must be constant expressions',1002);
  };
  const result=String(source).replace(/\r\n?/g,'\n').split('\n').map((line,i)=>{
    if(!/^\s*#(?:Const|If|ElseIf|Else|End)\b/i.test(line))return enabled()?line:'';
    const text=line.trim().replace(/\s+'[^\n]*$/,'');let m;
    try {
      if((m=text.match(/^#Const\s+(\w+)\s*=\s*(.+)$/i))){if(enabled())values.set(m[1].toLowerCase(),evaluate(parseExpression(m[2])));}
      else if((m=text.match(/^#If\s+(.+)\s+Then\s*$/i))){const parent=enabled(),active=parent&&truth(evaluate(parseExpression(m[1])));frames.push({parent,active,taken:active,hadElse:false,line:i+1});}
      else if((m=text.match(/^#ElseIf\s+(.+)\s+Then\s*$/i))){const f=frames.at(-1);if(!f||f.hadElse)throw new VBError('Unexpected #ElseIf',1002);f.active=f.parent&&!f.taken&&truth(evaluate(parseExpression(m[1])));f.taken ||= f.active;}
      else if(/^#Else\s*$/i.test(text)){const f=frames.at(-1);if(!f||f.hadElse)throw new VBError('Unexpected #Else',1002);f.hadElse=true;f.active=f.parent&&!f.taken;f.taken=true;}
      else if(/^#End\s+If\s*$/i.test(text)){if(!frames.length)throw new VBError('Unexpected #End If',1002);frames.pop();}
      else throw new VBError('Invalid conditional compilation directive',1002);
    }catch(error){error.source=sourceName;error.line=i+1;throw error;}
    return '';
  });
  if(frames.length)throw new VBError('Expected #End If',1002,sourceName,frames.at(-1).line);
  return result.join('\n');
}
