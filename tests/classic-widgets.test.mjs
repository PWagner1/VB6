import test from 'node:test';
import assert from 'node:assert/strict';
import {stepperValue} from '../src/controls/native-widgets.js';
import {el} from '../src/core/core.js';
test('Spin step respects positive increment and both bounds',()=>{assert.equal(stepperValue({Min:0,Max:10,Value:9,Increment:3},1),10);assert.equal(stepperValue({Min:0,Max:10,Value:1,Increment:3},-1),0);});
test('Spin wrapping includes reversed Min/Max endpoints',()=>{assert.equal(stepperValue({Min:0,Max:5,Value:5,Wrap:-1},1),0);assert.equal(stepperValue({Min:5,Max:0,Value:0,Wrap:-1},-1),5);});
test('Spin zero increment and non-finite values do not move',()=>{assert.equal(stepperValue({Min:0,Max:10,Value:3,Increment:0},1),3);assert.equal(stepperValue({Min:0,Max:Infinity,Value:3},1),3);});
test('Element factory distinguishes ARIA/enumerated false from HTML boolean false',()=>{
  const old=globalThis.document;try{globalThis.document={createElement:()=>({attributes:{},setAttribute(k,v){this.attributes[k]=String(v)},append(){}})};
  const n=el('input',{'aria-expanded':false,'aria-disabled':true,disabled:false,checked:true,spellcheck:false,contenteditable:false});
  assert.deepEqual(n.attributes,{'aria-expanded':'false','aria-disabled':'true',checked:'',spellcheck:'false',contenteditable:'false'});
  }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
