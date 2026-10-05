import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='src/editor/editor.js',hash=s=>createHash('sha256').update(s).digest('hex');
let source=readFileSync(path,'utf8');
const before='e5487ca460c0ef987b9d22e0121e0b161bef00696995f87f87423e6b5beea2cd',after='5ea37f6e6c3a18bc7e09cb95b5085824ef1f81f5ad16d03d03a46d10b34c93a4';
if(hash(source)!==after){if(hash(source)!==before)throw Error('Source changed');source=source.replace('options.findIndex(option=>option.dataset.event===previousEvent):-1;return;',"options.findIndex(option=>option.dataset.event===previousEvent&&!option.value.startsWith('event:')):-1;return;");if(hash(source)!==after)throw Error('Output mismatch');writeFileSync(path,source);}
