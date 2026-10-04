/** Serializable, DOM-independent docking model. A window belongs to exactly one
 * group; hidden tabs retain their placement. Restores accept known window IDs
 * only and validate atomically before replacing the current layout.
 */
export const DOCK_EDGES=Object.freeze(['left','right','top','bottom']);
const finite=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function normalizeDockRect(value={}){return {x:clamp(finite(value.x,80),0,10000),y:clamp(finite(value.y,60),0,10000),width:clamp(finite(value.width,300),80,4000),height:clamp(finite(value.height,250),60,4000)};}
export function constrainDockRect(rect,width,height){const r=normalizeDockRect(rect),w=Math.max(40,finite(width,800)),h=Math.max(32,finite(height,600));r.width=Math.min(w,r.width);r.height=Math.min(h,r.height);r.x=clamp(r.x,0,w-r.width);r.y=clamp(r.y,0,h-r.height);return r;}
export class DockLayout {
  constructor(){this.windows=new Map();this.groups=new Map();this.sizes={left:74,right:250,top:170,bottom:190};this.sequence=0;}
  register(id,{edge='right',group=id,hidden=false,dockable=true,weight=1,bounds={}}={}){
    if(this.windows.has(id))return this.windows.get(id);if(!DOCK_EDGES.includes(edge))edge='right';
    if(!this.groups.has(group))this.groups.set(group,{id:group,edge,tabs:[],active:id,weight,bounds:normalizeDockRect(bounds)});
    const window={id,group,hidden:!!hidden,dockable:!!dockable,home:{edge,group},bounds:normalizeDockRect(bounds)};
    this.windows.set(id,window);this.groups.get(group).tabs.push(id);return window;
  }
  unregister(id){this.detach(id);this.windows.delete(id);}
  detach(id){const window=this.windows.get(id);if(!window)return;const group=this.groups.get(window.group);if(!group)return;group.tabs=group.tabs.filter(n=>n!==id);if(group.active===id)group.active=group.tabs.find(n=>!this.windows.get(n)?.hidden)||group.tabs[0];if(!group.tabs.length)this.groups.delete(group.id);}
  show(id,visible=true){const window=this.windows.get(id);if(!window)return;window.hidden=!visible;const group=this.groups.get(window.group);if(visible)group.active=id;else if(group.active===id)group.active=group.tabs.find(n=>!this.windows.get(n).hidden)||group.tabs[0];}
  activate(id){const w=this.windows.get(id);if(w){w.hidden=false;this.groups.get(w.group).active=id;}}
  float(id,bounds){const w=this.windows.get(id);if(!w)return;const previous=this.groups.get(w.group);if(previous.edge!=='float')w.home={edge:previous.edge,group:previous.id};this.detach(id);const group='float-'+(++this.sequence);w.group=group;w.hidden=false;this.groups.set(group,{id:group,edge:'float',tabs:[id],active:id,weight:1,bounds:normalizeDockRect(bounds||w.bounds)});return this.groups.get(group);}
  floatGroup(id,bounds){const g=this.groups.get(id);if(!g)return;for(const name of g.tabs){const w=this.windows.get(name);if(g.edge!=='float')w.home={edge:g.edge,group:g.id};}g.edge='float';g.bounds=normalizeDockRect(bounds||g.bounds);return g;}
  dock(id,edge='right',target=null){
    const w=this.windows.get(id);if(!w||!w.dockable)return false;
    if(!DOCK_EDGES.includes(edge))throw new Error('Invalid dock edge.');
    if(target===w.group&&this.groups.get(target)?.edge===edge){this.activate(id);return true;}
    const existing=target&&this.groups.get(target);if(existing&&existing.edge!==edge)throw new Error('The target group is on another edge.');
    this.detach(id);const group=existing||{id:'dock-'+(++this.sequence),edge,tabs:[],active:id,weight:1,bounds:normalizeDockRect(w.bounds)};this.groups.set(group.id,group);group.tabs.push(id);group.active=id;w.group=group.id;w.hidden=false;w.home={edge,group:group.id};return true;
  }
  redock(id){const w=this.windows.get(id);if(!w)return;const home=w.home;return this.dock(id,home.edge,this.groups.has(home.group)&&this.groups.get(home.group).edge===home.edge?home.group:null);}
  setDockable(id,value){const w=this.windows.get(id);if(!w)return;w.dockable=!!value;if(!value&&this.groups.get(w.group).edge!=='float')this.float(id);}
  visible(group){return group.tabs.filter(id=>!this.windows.get(id)?.hidden);}
  snapshot(){return {version:1,sizes:{...this.sizes},groups:[...this.groups.values()].map(g=>structuredClone(g)),windows:[...this.windows.values()].map(w=>structuredClone(w))};}
  restore(value){
    if(!value||value.version!==1||!Array.isArray(value.groups)||!Array.isArray(value.windows))throw new Error('Invalid docking layout.');
    if(value.groups.length>100||value.windows.length>100)throw new Error('Docking layout is too large.');
    const windows=new Map(),groups=new Map(),seen=new Set();
    for(const entry of value.windows){if(!entry||typeof entry.id!=='string')throw new Error('Invalid window descriptor.');if(!this.windows.has(entry.id))continue;if(windows.has(entry.id))throw new Error('Duplicate window in layout.');const old=this.windows.get(entry.id);windows.set(entry.id,{...structuredClone(old),hidden:!!entry.hidden,dockable:entry.dockable!==false,bounds:normalizeDockRect(entry.bounds),home:{edge:DOCK_EDGES.includes(entry.home?.edge)?entry.home.edge:old.home.edge,group:String(entry.home?.group||old.home.group).slice(0,100)}});}
    for(const entry of value.groups){if(!entry||typeof entry.id!=='string'||entry.id.length>100||groups.has(entry.id)||!Array.isArray(entry.tabs)||!DOCK_EDGES.concat('float').includes(entry.edge))throw new Error('Invalid docking group.');const tabs=[];for(const id of entry.tabs){if(!windows.has(id))continue;if(seen.has(id))throw new Error('Window occurs in more than one group.');seen.add(id);tabs.push(id);windows.get(id).group=entry.id;}if(tabs.length){const active=tabs.includes(entry.active)?entry.active:tabs[0];groups.set(entry.id,{id:entry.id,edge:entry.edge,tabs,active,weight:clamp(finite(entry.weight,1),.1,20),bounds:normalizeDockRect(entry.bounds)});}}
    for(const [id,old]of this.windows){if(seen.has(id))continue;const w=windows.get(id)||structuredClone(old);let group='restore-'+id;while(groups.has(group))group+='-';w.group=group;windows.set(id,w);groups.set(group,{id:group,edge:w.dockable?w.home.edge:'float',tabs:[id],active:id,weight:1,bounds:normalizeDockRect(w.bounds)});}
    for(const g of groups.values())if(g.edge!=='float'&&g.tabs.some(id=>!windows.get(id).dockable))throw new Error('A non-dockable window cannot be restored docked.');
    this.windows=windows;this.groups=groups;for(const edge of DOCK_EDGES)this.sizes[edge]=clamp(finite(value.sizes?.[edge],this.sizes[edge]),40,1400);this.sequence=Math.max(this.sequence,...[...groups.keys()].map(s=>Number(s.match(/-(\d+)$/)?.[1])||0));
  }
}
