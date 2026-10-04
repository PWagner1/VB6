/** Cursor/viewport metadata only: source text and debugger state are not serialized. */
const number=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function normalizeEditorView(value={},length=Number.MAX_SAFE_INTEGER) {
  if(!value||typeof value!=='object')value={};
  const panes=(Array.isArray(value.panes)?value.panes:[]).slice(0,2).filter(p=>p&&typeof p==='object').map(p=>({
    mode:p.mode==='procedure'?'procedure':'module',declarations:p.declarations===true,
    start:Math.trunc(number(p.start,0,length,0)),end:Math.trunc(number(p.end,0,length,0)),
    backward:p.backward===true,top:number(p.top,0,1e9,0),left:number(p.left,0,1e7,0)
  }));
  for(const p of panes)if(p.start>p.end)[p.start,p.end]=[p.end,p.start];
  return {version:1,ratio:number(value.ratio,.05,.95,.5),active:value.active===1&&panes.length===2?1:0,panes};
}
export function snapshotEditorView(editor) {
  return normalizeEditorView({ratio:editor.splitRatio,active:editor.panes.indexOf(editor.activePane),panes:editor.panes.map(p=>{
    const s=editor.selectionBounds(p),v=p.virtualizer;return {mode:p.mode,declarations:p.explicitDeclarations,start:s.start,end:s.end,backward:v?.active?v.direction==='backward':p.input.selectionDirection==='backward',top:v?.active?v.rail.scrollTop:p.input.scrollTop,left:p.input.scrollLeft};
  })},editor.text.length);
}
export function restoreEditorView(editor,value) {
  const state=normalizeEditorView(value,editor.text.length);if(!state.panes.length)return;
  editor.toggleSplit(state.panes.length===2,state.ratio);if(state.panes.length===2)editor.setSplitRatio(state.ratio);
  for(let i=0;i<state.panes.length;i++){
    const saved=state.panes[i],p=editor.panes[i];p.mode=saved.mode;p.explicitDeclarations=saved.declarations;
    editor.syncPane(p,saved.start,saved.end,{scroll:false});
    if(p.virtualizer?.active){p.virtualizer.select(saved.backward?saved.end:saved.start,saved.backward?saved.start:saved.end,{reveal:false});p.virtualizer.scrollTo(saved.top);}
    else {p.input.setSelectionRange(Math.max(0,saved.start-p.range.start),Math.max(0,saved.end-p.range.start),saved.backward?'backward':'forward');p.input.scrollTop=saved.top;}
    p.input.scrollLeft=saved.left;
  }
  editor.activatePane(editor.panes[state.active]);editor.paint();
}
