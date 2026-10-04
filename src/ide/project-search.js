import {el,clone} from '../core/core.js';
import {searchProject,replaceProject,validateSearch} from '../editor/navigation.js';
import {ToolList} from './virtual-list.js';
import {icon} from './ui.js';

export class ProjectSearch {
  constructor(ide){
    this.ide=ide;this.key='tool:project-search';this.title='Find in Project';this.glyph='find';this.width=750;this.height=410;
    this.root=el('div',{class:'project-search-window'});this.query=el('input',{'aria-label':'Find in project'});this.replacement=el('input',{'aria-label':'Project replacement text'});this.scope=el('select',{'aria-label':'Search scope'},el('option',{value:'project'},'Current Project'),el('option',{value:'module'},'Current Module'));
    this.matchCase=el('input',{type:'checkbox'});this.wholeWord=el('input',{type:'checkbox'});
    this.root.append(el('div',{class:'project-search-fields'},el('label',{},'Find What:',this.query),el('label',{},'Search:',this.scope),el('button',{onclick:()=>this.search(),'aria-label':'Find all in project'},icon('find'),' Find All')));
    this.replaceButton=el('button',{'aria-label':'Replace all in project',onclick:()=>this.replace()},'Replace All');this.replaceRow=el('div',{class:'project-replace-row',hidden:true},el('label',{},'Replace With:',this.replacement),this.replaceButton);this.root.append(this.replaceRow);
    this.root.append(el('div',{class:'project-search-options'},el('label',{},this.matchCase,'Match Case'),el('label',{},this.wholeWord,'Find Whole Word Only'),el('button',{onclick:()=>{this.replaceRow.hidden=!this.replaceRow.hidden;this.refresh();}},'Replace…')));
    this.list=new ToolList('Project search results',item=>{this.preview.textContent=item?item.module+'('+item.line+', '+item.column+')\n'+item.text:'';},item=>this.navigate(item));
    this.preview=el('pre',{class:'search-preview','aria-label':'Search result preview'});this.status=el('div',{class:'tool-status',role:'status'});this.root.append(this.list.root,this.preview,this.status);
    this.query.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.search();}});this.replacement.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.replace();}});
    this.root.addEventListener('keydown',e=>{if(e.key==='F3'){e.preventDefault();e.stopPropagation();this.list.select(this.list.selected+(e.shiftKey?-1:1));this.navigate(this.list.items[this.list.selected]);}});
  }
  show(replace=false){this.replaceRow.hidden=!replace;this.refresh();this.query.focus();this.query.select();}
  refresh(){this.replaceButton.disabled=this.ide.runState!=='design';this.replacement.readOnly=this.ide.runState!=='design';}
  search(){try{const moduleId=this.scope.value==='module'?this.ide.activeModule?.id:null;if(this.scope.value==='module'&&!moduleId)throw new Error('Open a module before searching the current module.');this.result=searchProject(this.ide.project,this.query.value,{moduleId,matchCase:this.matchCase.checked,wholeWord:this.wholeWord.checked});this.list.set(this.result.hits.map((h,i)=>({...h,key:String(i),label:h.module+' ('+h.line+', '+h.column+')  '+h.text.trim(),glyph:'▤'})));this.status.textContent=this.result.hits.length+(this.result.truncated?'+':'')+' matches in '+this.result.modules.length+' module(s).'+(this.result.truncated?' Narrow this search before replacing.':'');this.status.classList.remove('tool-error');}catch(e){this.error(e);}}
  error(e){this.status.textContent=e.message;this.status.classList.add('tool-error');}
  navigate(hit){if(!hit||!this.result)return;try{validateSearch(this.ide.project,this.result);this.ide.openDocument(hit.moduleId,'code',hit.line);const editor=this.ide.editor;editor.setViewMode('module');editor.goToLine(hit.line,hit.column);editor.input.setSelectionRange(hit.start,hit.end);editor.paint();}catch(e){this.error(e);}}
  replace(){try{
    if(this.ide.runState!=='design')throw new Error('End the running program before replacing project source.');
    if(!this.result)throw new Error('Find All first so you can review the matches.');
    if(this.result.query!==this.query.value||this.result.matchCase!==this.matchCase.checked||this.result.wholeWord!==this.wholeWord.checked||(this.result.moduleId===null)!==(this.scope.value==='project'))throw new Error('Search options changed. Find All again before replacing.');
    const before=clone(this.ide.project),count=this.result.hits.length;this.ide.project=replaceProject(this.ide.project,this.result,this.replacement.value);this.ide.record(before,'Replace '+count+' project matches',true,false);this.search();this.status.textContent=count+' replacements committed as one undoable project edit.';
  }catch(e){this.error(e);}}
  dispose(){this.list.dispose();}
}
