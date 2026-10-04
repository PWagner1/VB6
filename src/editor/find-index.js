/** One cached search index per editor. Literal replacements are assembled in a
 * single pass; they never repeatedly copy the entire module for each match. */
export class FindIndex {
  constructor(){this.scans=0;this.clear();}
  clear(){this.text=null;this.key=null;this.matches=[];}
  search(text,query,{matchCase=false,wholeWord=false}={}) {
    text=String(text);query=String(query);const key=JSON.stringify([query,!!matchCase,!!wholeWord]);
    if(text===this.text&&key===this.key)return this.matches;
    this.text=text;this.key=key;this.scans++;this.matches=[];if(!query)return this.matches;
    const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const expression=new RegExp((wholeWord?'\\b':'')+escaped+(wholeWord?'\\b':''),'g'+(matchCase?'':'i'));
    for(const match of text.matchAll(expression))this.matches.push({start:match.index,end:match.index+match[0].length});
    return this.matches;
  }
  next(offset,direction=1) {
    if(!this.matches.length)return null;
    let lo=0,hi=this.matches.length;
    while(lo<hi){const mid=(lo+hi)>>>1;if(direction>0?this.matches[mid].start<offset:this.matches[mid].end<=offset)lo=mid+1;else hi=mid;}
    const index=direction>0?(lo===this.matches.length?0:lo):(lo===0?this.matches.length-1:lo-1);
    return {...this.matches[index],index,count:this.matches.length};
  }
}
export function replaceMatches(source,matches,replacement) {
  source=String(source);replacement=String(replacement);const parts=[];let end=0;
  for(const match of matches){if(!Number.isInteger(match.start)||!Number.isInteger(match.end)||match.start<end||match.end<match.start||match.end>source.length)throw new RangeError('Invalid or overlapping replacement range.');parts.push(source.slice(end,match.start),replacement);end=match.end;}
  parts.push(source.slice(end));return parts.join('');
}

/** A same-document text move is one source transaction. Moving into the original
 * selection is a no-op. UTF-16 offsets are retained, including surrogate pairs. */
export function moveSourceSelection(source,start,end,destination,copy=false) {
  if(![start,end,destination].every(Number.isInteger)||start<0||end<start||end>source.length||destination<0||destination>source.length)throw new RangeError('Invalid text move range.');
  if(start===end||!copy&&destination>=start&&destination<=end)return {text:source,start,end,changed:false};
  const selected=source.slice(start,end),base=copy?source:source.slice(0,start)+source.slice(end),at=!copy&&destination>end?destination-(end-start):destination;
  const text=base.slice(0,at)+selected+base.slice(at);return {text,start:at,end:at+selected.length,changed:text!==source};
}
