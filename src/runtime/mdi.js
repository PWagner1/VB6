import {VBError} from '../language/lexer.js';
import {el} from '../core/core.js';
import {NOTHING} from './values.js';
/** Deterministic integer-pixel arrangements, independent of DOM or application code. */
export function arrangeMDIRects(count,width,height,mode=0){
  if(!Number.isFinite(width)||!Number.isFinite(height))throw new VBError('Invalid MDI dimensions',5);
  if(!Number.isInteger(count)||count<0||count>1000||!Number.isInteger(mode)||mode<0||mode>3)throw new VBError('Invalid MDI arrangement',5);
  width=Math.max(1,Math.floor(width));height=Math.max(1,Math.floor(height));const rects=[];
  for(let i=0;i<count;i++){
    if(mode===1){const top=Math.floor(i*height/count),bottom=Math.floor((i+1)*height/count);rects.push({left:0,top,width,height:bottom-top});}
    else if(mode===2){const left=Math.floor(i*width/count),right=Math.floor((i+1)*width/count);rects.push({left,top:0,width:right-left,height});}
    else if(mode===3){const cols=Math.max(1,Math.floor(width/160));rects.push({left:i%cols*160,top:Math.max(0,height-24-Math.floor(i/cols)*24),width:Math.min(160,width),height:24});}
    else{const step=22,slots=Math.max(1,Math.min(10,Math.floor(Math.min(width,height)/step)-2)),offset=i%slots*step;rects.push({left:offset,top:offset,width:Math.max(100,width-step*(slots-1)),height:Math.max(80,height-step*(slots-1))});}
  }return rects;
}
export class RuntimeMDI {
  constructor(host){this.host=host;this.parent=null;this.children=[];this.active=null;this.disposed=false;this.sequence=0;}
  register(form){
    if(form.type==='MDIForm'){
      if(this.parent&&this.parent!==form)throw new VBError('Only one MDI Form is permitted',360);this.parent=form;
      form.node.classList.add('vb-mdi-parent');form.mdiClient=el('div',{class:'vb-mdi-client','aria-label':'MDI client area'});form.content.append(form.mdiClient);form.mdiController=this;
      Object.defineProperty(form,'ActiveForm',{enumerable:true,get:()=>this.active?.shown?this.active.instance:NOTHING});
      form.Arrange=mode=>this.arrange(Number(mode));form.Arrange.vbRawArgs=true;
      form.node.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['F6','Tab'].includes(e.key)){e.preventDefault();e.stopPropagation();this.cycle(e.shiftKey?-1:1);}if((e.ctrlKey||e.metaKey)&&e.key==='F4'&&this.active){e.preventDefault();e.stopPropagation();form.vm.requestUnload(this.active.instance);}});
      this.observer=new ResizeObserver(()=>this.layout());this.observer.observe(form.content);
    }
    if(form.type!=='MDIForm'&&Number(form.props.MDIChild)){
      form.mdiController=this;form.mdiChild=true;form.node.classList.add('vb-mdi-child');this.children.push(form);
      const show=form.Show.bind(form),hide=form.Hide.bind(form),activate=form.activateChrome.bind(form);
      form.Show=()=>{this.attach();if(!form.mdiPlaced){form.movedByUser=true;form.mdiPlaced=true;const i=this.children.indexOf(form),area=this.size();form.props.Left=Math.min(i*22,Math.max(0,area.width-110))*15;form.props.Top=Math.min(i*22,Math.max(0,area.height-50))*15;}show();this.activate(form,false);};
      form.Hide=()=>{hide();if(this.active===form){this.active=null;const next=this.children.filter(c=>c!==form&&c.shown&&!c.minimized).at(-1);if(next)this.activate(next);else if(this.parent)form.vm.library.get('screen').ActiveForm=this.parent.instance;}};
      form.activateChrome=(notify=true)=>{activate();if(form.shown)this.activate(form,notify);};
    }
    this.attach();
  }
  attach(){if(!this.parent)return;for(const child of this.children)if(child.node.parentElement!==this.parent.mdiClient)this.parent.mdiClient.append(child.node);this.layout();}
  size(){const p=this.parent,client=p?.mdiClient;return {width:client?.clientWidth||Math.max(1,Number(p?.props.ClientWidth||9000)/15),height:client?.clientHeight||Math.max(1,Number(p?.props.ClientHeight||6000)/15)};}
  layout(){if(!this.parent||this.disposed)return;const p=this.parent,w=Number(p.props.ClientWidth||9000)/15,h=Number(p.props.ClientHeight||6000)/15;let left=0,top=0,right=w,bottom=h;
    for(const c of p.controls){if(c.model.parent||Number(c.props.Visible)===0)continue;const mode=Number(c.props.Align)||0,cw=Number(c.props.Width)/15,ch=Number(c.props.Height)/15;if(mode===1||mode===2){c.props.Left=left*15;c.props.Top=(mode===1?top:bottom-ch)*15;c.props.Width=(right-left)*15;if(mode===1)top+=ch;else bottom-=ch;c.refresh();}else if(mode===3||mode===4){c.props.Left=(mode===3?left:right-cw)*15;c.props.Top=top*15;c.props.Height=(bottom-top)*15;if(mode===3)left+=cw;else right-=cw;c.refresh();}}
    Object.assign(p.mdiClient.style,{left:left+'px',top:top+'px',width:Math.max(1,right-left)+'px',height:Math.max(1,bottom-top)+'px'});
    for(const c of this.children)if(c.savedBounds&&!c.minimized){c.props.Left=0;c.props.Top=0;c.props.ClientWidth=Math.max(60,right-left-8)*15;c.props.ClientHeight=Math.max(30,bottom-top-c.chromeHeight())*15;c.refresh();}
  }
  activate(form,notify=true){if(!form.shown)return;const previous=this.active;this.active=form;form.vm.library.get('screen').ActiveForm=form.instance;
    for(const c of this.children)c.node.classList.toggle('vb-inactive',c!==form);form.node.style.zIndex=String(++this.sequence);
    if(previous!==form&&notify){if(previous?.shown)previous.event('Deactivate');form.event('Activate');}}
  cycle(direction=1){const visible=this.children.filter(c=>c.shown);if(!visible.length)return;const next=visible[(visible.indexOf(this.active)+direction+visible.length)%visible.length];if(next.minimized)next.toggleMinimize();this.activate(next);next.titleBar.focus();}
  arrange(mode=0){if(!Number.isInteger(mode)||mode<0||mode>3)throw new VBError('Invalid MDI arrangement',5);const children=this.children.filter(c=>c.shown&&(mode===3?c.minimized:!c.minimized)),area=this.size(),rects=arrangeMDIRects(children.length,area.width,area.height,mode);
    children.forEach((c,i)=>{if(c.savedBounds)c.toggleMaximize();const r=rects[i];c.movedByUser=true;c.props.Left=r.left*15;c.props.Top=r.top*15;if(mode!==3){c.props.ClientWidth=Math.max(60,r.width-8)*15;c.props.ClientHeight=Math.max(30,r.height-c.chromeHeight())*15;}c.refresh();c.event('Resize');});return undefined;}
  windowItems(){const shown=this.children.filter(c=>c.shown);return shown.slice(0,100).map((form,i)=>({label:(i<9?'&'+(i+1)+' ':'')+String(form.props.Caption||form.model.name).replace(/&/g,'&&'),checked:form===this.active,action:()=>{if(form.minimized)form.toggleMinimize();this.activate(form);form.titleBar.focus();}}));}
  dispose(){this.disposed=true;this.observer?.disconnect();}
}
