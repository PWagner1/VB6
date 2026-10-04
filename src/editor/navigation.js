import {indexSource,positionAt,textChange} from './projection.js';

/** Bookmark lines are 1-based source positions, never pane-relative positions. */
export function normalizeBookmarks(values,text){
  const count=String(text).split('\n').length;
  return [...new Set((Array.isArray(values)?values:[]).filter(n=>Number.isInteger(n)&&n>0&&n<=count))].sort((a,b)=>a-b);
}
export function mapBookmarks(oldText,newText,values){
  if(!Array.isArray(values)||!values.length)return [];const marks=normalizeBookmarks(values,oldText);if(oldText===newText||!marks.length)return marks;
  const old=indexSource(oldText),next=indexSource(newText),change=textChange(oldText,newText);
  // Formatting or renaming without adding/removing lines preserves the line anchors.
  if(old.lines.length===next.lines.length)return normalizeBookmarks(marks,newText);
  return normalizeBookmarks(marks.flatMap(line=>{
    const start=old.starts[line-1],end=line<old.lines.length?old.starts[line]:oldText.length;
    if(change.newEnd===change.start&&change.start<=start&&change.oldEnd>=end&&end>start)return [];
    let offset=start;
    if(start>=change.oldEnd)offset+=change.delta;
    else if(start>change.start)offset=change.start;
    return [positionAt(next,offset).line];
  }),newText);
}
export function navigateBookmark(project,moduleId,line,direction=1){
  const entries=project.modules.flatMap((m,index)=>normalizeBookmarks(m.bookmarks,m.code).map(line=>({moduleId:m.id,index,line})));
  if(!entries.length)return null;
  const index=project.modules.findIndex(m=>m.id===moduleId);
  return direction>0?(entries.find(e=>e.index>index||e.index===index&&e.line>line)||entries[0]):([...entries].reverse().find(e=>e.index<index||e.index===index&&e.line<line)||entries.at(-1));
}

/** Literal source search. Bounded results; never executes a user-supplied regexp. */
export function searchProject(project,query,{matchCase=false,wholeWord=false,moduleId=null,limit=20000}={}){
  query=String(query);if(!query||query.length>4096)throw new Error('Enter between 1 and 4,096 characters to find.');
  limit=Math.max(1,Math.min(20000,Math.floor(limit)||20000));
  const regex=new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'+(matchCase?'':'i'));
  const modules=project.modules.filter(m=>!moduleId||m.id===moduleId).map(m=>({id:m.id,name:m.name,code:m.code}));
  if(!modules.length)throw new Error('The search module no longer exists.');
  const result={projectId:project.id,query,matchCase,wholeWord,moduleId,modules,hits:[],truncated:false};
  outer:for(const module of modules){const index=indexSource(module.code);regex.lastIndex=0;let match;
    while((match=regex.exec(module.code))){const start=match.index,end=start+match[0].length;
      if(wholeWord&&(/[A-Za-z0-9_]/.test(module.code[start-1]||'')||/[A-Za-z0-9_]/.test(module.code[end]||'')))continue;
      if(result.hits.length>=limit){result.truncated=true;break outer;}
      const pos=positionAt(index,start);result.hits.push({moduleId:module.id,module:module.name,start,end,line:pos.line,column:pos.column,text:index.lines[pos.line-1].slice(0,800)});
    }
  }
  return result;
}
export function validateSearch(project,result){
  if(project.id!==result.projectId)throw new Error('The search belongs to a different project. Search again.');
  const current=project.modules.filter(m=>!result.moduleId||m.id===result.moduleId);
  if(current.length!==result.modules.length||result.modules.some(m=>!current.some(n=>n.id===m.id&&n.code===m.code)))throw new Error('Source has changed since this search. Search again before navigating or replacing.');
}
/** Validate all snapshots first, then replace in a new project: one atomic undo unit. */
export function replaceProject(project,result,replacement){
  validateSearch(project,result);if(result.truncated)throw new Error('The result limit was reached. Narrow the search before replacing.');
  replacement=String(replacement);if(replacement.length>100000)throw new Error('Replacement exceeds 100,000 characters.');
  const next=structuredClone(project),byModule=new Map();for(const hit of result.hits){let list=byModule.get(hit.moduleId);if(!list)byModule.set(hit.moduleId,list=[]);list.push(hit);}
  for(const module of next.modules){const hits=byModule.get(module.id)||[];
    const size=module.code.length+hits.reduce((n,h)=>n+replacement.length-h.end+h.start,0);if(size>5000000)throw new Error('Replacement would exceed the module size limit.');
    const source=module.code,chunks=[];let cursor=0;for(const hit of hits){chunks.push(source.slice(cursor,hit.start),replacement);cursor=hit.end;}chunks.push(source.slice(cursor));const code=chunks.join('');
    let marks=normalizeBookmarks(module.bookmarks,source);
    if(marks.length&&source.split('\n').length!==code.split('\n').length){const old=indexSource(source),updated=indexSource(code);let h=0,delta=0;
      marks=normalizeBookmarks(marks.flatMap(line=>{const pos=old.starts[line-1],end=line<old.lines.length?old.starts[line]:source.length;
        while(h<hits.length&&hits[h].end<=pos){delta+=replacement.length-hits[h].end+hits[h].start;h++;}
        const hit=hits[h];if(hit&&hit.start<=pos&&hit.end>pos){if(!replacement&&hit.start<=pos&&hit.end>=end)return [];return [positionAt(updated,hit.start+delta).line];}
        return [positionAt(updated,pos+delta).line];
      }),code);
    }
    module.code=code;if(module.bookmarks||marks.length)module.bookmarks=marks;
  }
  return next;
}
