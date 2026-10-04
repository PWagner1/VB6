/** Original pixel-aligned 16px glyphs. Window/control icons never depend on emoji fonts. */
import {el} from '../core/core.js';
const black='#000',white='#fff',gray='#808080',face='#c0c0c0',blue='#000080',yellow='#ffff80';
const rect=(x,y,w,h,fill,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`;
const line=(d,stroke=black)=>`<path d="${d}" fill="none" stroke="${stroke}"/>`;
const box=(x=1,y=2,w=14,h=12)=>rect(x,y,w,h,face,black)+line(`M${x+1} ${y+h-1}V${y+1}H${x+w-1}`,white);
const page=()=>rect(3,1,10,14,white,black)+line('M5 5h6M5 8h6M5 11h5',blue);
const form=()=>box()+rect(2,3,12,2,blue)+rect(3,7,4,4,white,gray)+rect(9,8,4,3,face,gray);
const list=()=>rect(1,1,14,14,white,black)+line('M3 4h7M3 7h7M3 10h7M3 13h7',blue)+rect(12,2,2,12,face)+line('M12 5h2M12 11h2');
const check=()=>rect(2,2,12,12,white,gray)+line('M4 8l3 3 5-7M4 9l3 3 5-7');
const radio=()=>'<circle cx="8" cy="8" r="6" fill="white" stroke="#808080"/><circle cx="8" cy="8" r="3" fill="#000"/>';
const folder=()=>'<path d="M1 4h5l2 2h7v8H1z" fill="#ffff80" stroke="#808000"/>'+line('M2 7h12',white);
const grid=()=>rect(1,2,14,12,white,black)+rect(2,3,12,3,face)+rect(2,3,3,10,face)+line('M1 6h14M1 10h14M5 2v12M10 2v12',gray);
const picture=()=>rect(1,1,14,14,white,black)+rect(2,2,12,6,'#008080')+'<path d="M2 13l4-6 3 3 3-4 2 7z" fill="#008000"/>'+rect(10,3,2,2,yellow);
const hscroll=()=>box(1,4,14,8)+rect(2,5,3,6,face,gray)+rect(11,5,3,6,face,gray)+line('M4 6L2 8l2 2M12 6l2 2-2 2');
const control={
 Pointer:'<path d="M3 1v12l3-3 3 5 2-1-3-5h5z" fill="#000" stroke="#fff"/>',
 PictureBox:picture(), Image:picture()+rect(1,1,14,14,'none',blue),
 Label:'<path d="M2 14h4v-1H5l1-3h5l1 3h-1v1h5v-1h-1L10 1H8L3 13H2zM7 8l2-5 2 5z" fill="#000" fill-rule="evenodd"/>',
 TextBox:rect(1,2,14,12,white,gray)+line('M3 8v3h3V7H3M8 4v7h3V7H8M13 4v8M12 4h2M12 12h2'),
 Frame:box(1,3,14,11)+rect(3,2,6,3,face)+line('M3 3h4M3 5h3'), CommandButton:box(1,5,14,8),
 CheckBox:check(), OptionButton:radio(), ListBox:list(), ComboBox:list()+rect(1,1,14,5,white,black)+rect(11,1,4,5,face,black)+line('M12 3h2M13 4h0'),
 HScrollBar:hscroll(),VScrollBar:`<g transform="rotate(90 8 8)">${hscroll()}</g>`,
 Timer:'<circle cx="8" cy="9" r="6" fill="#fff" stroke="#000"/>'+rect(6,0,4,2,black)+line('M8 4v5l3 2M3 4L1 2M13 4l2-2'),
 DriveListBox:box(1,5,14,7)+rect(3,7,8,2,gray)+rect(12,9,1,1,'#00ff00'), DirListBox:folder(),FileListBox:page(),
 Shape:'<circle cx="6" cy="6" r="4" fill="#00ffff" stroke="#008080"/>'+rect(6,6,8,8,'#ff8080',black),Line:line('M2 14L14 2'),
 Data:box(1,4,14,8)+line('M3 6v4M6 6L4 8l2 2M10 6l2 2-2 2M13 6v4'),
 OLE:box()+line('M3 6h2v5H3zM7 6v5h2M13 6h-3v5h3M10 8h2'),
 TreeView:rect(1,1,14,14,white,black)+line('M4 4v8h4M4 7h4',gray)+rect(2,2,4,3,yellow,gray)+rect(8,6,5,3,yellow,gray)+rect(8,11,5,3,yellow,gray),
 ListView:grid(),ProgressBar:box(1,5,14,6)+rect(3,7,3,2,blue)+rect(7,7,3,2,blue),
 Slider:line('M1 7h14M2 12v2M6 12v2M10 12v2M14 12v2',gray)+box(5,3,5,8),UpDown:box(4,1,8,14)+line('M4 8h8M6 5l2-2 2 2M6 11l2 2 2-2'),
 Toolbar:box(1,2,14,12)+rect(2,3,12,3,blue)+rect(3,8,3,3,yellow,gray)+rect(8,8,4,3,white,gray),
 StatusBar:form()+rect(2,11,12,2,white,gray),TabStrip:box(1,5,14,10)+box(1,1,7,5)+rect(2,5,5,1,face)+box(8,2,6,3),
 SSTab:box(1,5,14,10)+box(1,1,7,5)+rect(2,5,5,1,face)+box(8,2,6,3),
 RichTextBox:page()+line('M5 13h6',black),MSFlexGrid:grid(),MSHFlexGrid:grid(),DataGrid:grid(),
 DTPicker:grid()+rect(2,3,12,3,blue),MonthView:grid()+rect(2,3,12,3,blue),
 ImageList:`<g transform="translate(-1 -1) scale(.8)">${picture()}</g><g transform="translate(4 4) scale(.8)">${picture()}</g>`,CommonDialog:form()+rect(5,7,9,7,face,black),
 MSChart:box()+rect(3,9,2,4,blue)+rect(7,6,2,7,'#008000')+rect(11,4,2,9,'#800000')
};
const icons={
 refresh:line('M12 4a5 5 0 1 0 1 6M12 1v4H8',blue),event:'<path d="M8 1H5L3 9h4l-1 6 7-9H9l2-5z" fill="#ffff80" stroke="#808000"/>',
 form:form(),code:page(),module:page(),class:page()+rect(6,7,6,5,yellow,black),folder:folder(),
 new:rect(3,1,10,14,white,black)+line('M10 1v4h3'),open:folder()+'<path d="M1 14l3-6h12l-3 6z" fill="#ffff80" stroke="#808000"/>',
 save:rect(1,1,14,14,'#808080',black)+rect(4,2,8,4,face)+rect(10,2,2,3,black)+rect(4,9,8,5,white)+line('M5 11h6M5 13h6',blue),
 run:'<path d="M5 3l6 5-6 5z" fill="#000080"/>',pause:rect(4,3,3,10,blue)+rect(10,3,3,10,blue),stop:rect(4,4,8,8,blue),
 undo:line('M2 6h6q7 0 6 7M2 6l4-4M2 6l4 4',blue),redo:line('M14 6H8q-7 0-6 7M14 6l-4-4M14 6l-4 4',blue),
 cut:line('M6 10L13 1M9 10L4 1')+'<circle cx="4" cy="12" r="3" fill="none" stroke="#000"/><circle cx="11" cy="12" r="3" fill="none" stroke="#000"/>',
 copy:rect(1,1,9,11,white,black)+rect(6,5,9,10,white,black)+line('M8 8h5M8 10h5M8 12h4',blue),paste:rect(2,2,10,12,yellow,black)+rect(4,1,6,3,face,black)+rect(7,6,8,9,white,black)+line('M9 8h4M9 11h4',blue),
 properties:grid(),project:control.TreeView,find:'<circle cx="6" cy="6" r="4" fill="#fff" stroke="#000"/><path d="M9 10l5 5" stroke="#000" stroke-width="3"/>',
 export:page()+line('M7 8h8M12 5l3 3-3 3','#008000'),step:line('M2 2h8v6H5M5 8l3-3M5 8l3 3',blue)+line('M2 14h12'),
 breakpoint:'<circle cx="8" cy="8" r="6" fill="#800000" stroke="#000"/>',object:'<path d="M8 1l6 4v7l-6 3-6-3V5z" fill="#ffff80" stroke="#808000"/>'+line('M2 5l6 3 6-3M8 8v7','#808000'),
 help:'<circle cx="8" cy="8" r="7" fill="#ffff80" stroke="#808000"/>'+line('M5 5V4h5v3L8 9v1M8 12v1',blue),
 delete:line('M3 3l10 10M13 3L3 13','#800000'),pointer:control.Pointer,
 minimize:rect(3,11,7,2,black),maximize:rect(2,3,11,10,'none',black)+rect(2,3,11,2,black),
 restore:rect(5,2,8,8,face,black)+rect(5,2,8,2,black)+rect(2,6,8,7,face,black)+rect(2,6,8,2,black),
 close:line('M4 4l7 7M5 4l7 7M11 4l-7 7M12 4l-7 7'),
 'arrow-down':'<path d="M4 6h7l-3.5 4z" fill="currentColor"/>',
 'arrow-right':'<path d="M6 4l4 4-4 4z" fill="currentColor"/>',
 'check':line('M3 8l3 3 7-8M3 9l3 3 7-8'),
 information:'<circle cx="8" cy="8" r="7" fill="#0000aa" stroke="#000"/>'+rect(7,6,2,6,white)+rect(7,3,2,2,white),
 error:'<circle cx="8" cy="8" r="7" fill="#aa0000" stroke="#000"/>'+line('M4 4l8 8M5 4l7 7M12 4l-8 8M11 4l-7 7',white),
 warning:'<path d="M8 1l7 13H1z" fill="#ffff00" stroke="#000"/>'+rect(7,5,2,5,black)+rect(7,11,2,2,black),
 question:'<circle cx="8" cy="8" r="7" fill="#0000aa" stroke="#000"/>'+line('M5 5V4h5v4H8v2',white)+rect(7,12,2,2,white),
 'procedure':rect(2,2,12,12,white,black)+line('M4 5h7M4 8h7M4 11h3',blue),
 'full-module':rect(2,2,12,12,white,black)+line('M4 4h7M4 6h5M4 9h7M4 11h5',blue)
};
export function icon(name,size=16){
  const node=el('span',{class:'icon pixel-icon',style:{width:size+'px',height:size+'px'},'aria-hidden':'true'});
  node.innerHTML=`<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" fill="none" stroke-width="1">${icons[name]||icons.form}</svg>`;return node;
}
export function controlIcon(type){const node=el('span',{class:'control-icon pixel-icon type-'+type,'aria-hidden':'true'});node.innerHTML=`<svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges">${control[type]||control.OLE}</svg>`;return node;}
export const CONTROL_ICON_TYPES=Object.freeze(Object.keys(control));
export const ICON_NAMES=Object.freeze(Object.keys(icons));
