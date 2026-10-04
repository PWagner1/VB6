/** Generates only palette declarations; no font assets are read or distributed. */
import fs from 'node:fs';
import {THEMES,SYSTEM_ROLES} from '../src/theme/theme.js';
const kebab = key=>key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
let text='/* Generated palette declarations. See tools/theme-css.mjs. */\n';
for(const theme of Object.values(THEMES)){
 text+=(theme.id==='classic'?':root, ':'')+`[data-vb-theme="${theme.id}"] {\n`;
 for(const [name,value] of Object.entries(theme.colors))text+=`  --vb-${kebab(name)}: ${value};\n`;
 for(let i=0;i<SYSTEM_ROLES.length;i++)text+=`  --vb-sys-${i}: var(--vb-${kebab(SYSTEM_ROLES[i])});\n`;
 text+='}\n';
}
text+=`:root { --vb-font:"MS Sans Serif",Tahoma,Arial,sans-serif; --vb-size:11px; --vb-caption-height:18px; --vb-scrollbar:16px; }
[data-vb-theme] { color:var(--vb-text); color-scheme:light; }
[data-vb-theme="contrast"] { color-scheme:dark; }
.pixel-icon { display:inline-flex; flex:none; align-items:center; justify-content:center; vertical-align:middle; }
.pixel-icon svg { display:block; overflow:visible; }
button:disabled .pixel-icon { filter:grayscale(1); opacity:.5; }
[data-vb-theme="contrast"] .pixel-icon { filter:invert(1); }
[data-vb-theme="contrast"] .vb-command { text-shadow:none; }
`;
fs.writeFileSync(new URL('../src/theme/palette.css',import.meta.url),text);
