import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {constrainWindow} from '../src/ide/mdi.js';
import {scrollbarGeometry} from '../src/controls/scrollbar.js';
import {messageBoxOptions} from '../src/controls/dialog.js';
import {oleHex,parsePropertyNumber} from '../src/ide/property-editors.js';
import {bundle} from '../tools/bundle.mjs';
import {createControl,createForm} from '../src/project/model.js';
import {THEMES,colorValue} from '../src/theme/theme.js';
for(const [name,rect,size,expected]of[
 ['clamp negative origin',{x:-20,y:-8,width:500,height:400},[900,700],{x:0,y:0,width:500,height:400}],
 ['clamp oversized bounds',{x:900,y:800,width:2000,height:1000},[900,700],{x:4,y:4,width:896,height:696}],
 ['respect normal minimums',{x:20,y:20,width:1,height:1},[900,700],{x:20,y:20,width:220,height:140}],
 ['fit very narrow workspace',{x:50,y:50,width:660,height:440},[100,100],{x:4,y:4,width:96,height:96}],
 ['round stable pixel bounds',{x:6.4,y:7.8,width:400.2,height:300.1},[900,700],{x:6,y:8,width:400,height:300}]
])test('MDI geometry: '+name,()=>assert.deepEqual(constrainWindow(rect,...size),expected));
test('MDI tiled children can be smaller than manual resize minimum',()=>assert.equal(constrainWindow({width:125,height:400},900,700,40,40).width,125));
test('scroll thumb endpoints, middle, and short tracks',()=>{const a=scrollbarGeometry(0,100,0,200,10),b=scrollbarGeometry(0,100,100,200,10),c=scrollbarGeometry(0,100,50,200,10);assert.equal(a.offset,0);assert.equal(b.offset,b.travel);assert.equal(c.offset,Math.round(c.travel/2));assert.deepEqual(scrollbarGeometry(0,100,100,4,1),{thumb:4,travel:0,offset:0});});
test('scroll reversed and negative ranges preserve direction',()=>{assert.equal(scrollbarGeometry(10,-10,10,100).offset,0);const v=scrollbarGeometry(10,-10,-10,100);assert.equal(v.offset,v.travel);assert.equal(scrollbarGeometry(-20,-10,-15,100).offset,Math.round(scrollbarGeometry(-20,-10,-15,100).travel/2));});
test('scroll thumb clamps out-of-range values and handles an empty range',()=>{assert.equal(scrollbarGeometry(0,0,0,100).offset,0);assert.equal(scrollbarGeometry(0,100,-100,100).offset,0);const v=scrollbarGeometry(0,100,200,100);assert.equal(v.offset,v.travel);});
test('MsgBox flag combinations: return codes, symbols and default button',()=>{const x=messageBoxOptions(4+16+256);assert.deepEqual(x.buttons.map(b=>b.value),[6,7]);assert.equal(x.defaultIndex,1);assert.equal(x.glyph,'error');assert.equal(x.cancelValue,undefined);assert.equal(messageBoxOptions(0).cancelValue,1);});
test('MsgBox Cancel handling is not invented for Yes/No or Abort/Retry/Ignore',()=>{for(const style of [1,3,5])assert.equal(messageBoxOptions(style).cancelValue,2);for(const style of [2,4])assert.equal(messageBoxOptions(style).cancelValue,undefined);});
test('MsgBox flags clamp the default index and preserve RTL/alignment requests',()=>{const x=messageBoxOptions(3+48+768+524288+1048576);assert.equal(x.defaultIndex,2);assert.equal(x.glyph,'warning');assert.equal(x.rtl,true);assert.equal(x.rightAlign,true);});
test('property numbers: signed OLE colors, decimal, RGB notation and finite validation',()=>{assert.equal(parsePropertyNumber('&H8000000F&'),-2147483633);assert.equal(oleHex(-2147483633),'&H8000000F&');assert.equal(parsePropertyNumber('#123456'),0x563412);assert.equal(parsePropertyNumber('8.25'),8.25);for(const value of ['', 'NaN','Infinity','&HZZ','&H100000000'])assert.throws(()=>parsePropertyNumber(value));});
test('new default control colors adapt without changing authored RGB colors',()=>{for(const id of Object.keys(THEMES)){const text=createControl('TextBox');assert.equal(colorValue(text.properties.BackColor,'',id),THEMES[id].colors.window);assert.equal(colorValue(text.properties.ForeColor,'',id),THEMES[id].colors.windowText);assert.equal(colorValue(createForm().form.properties.BackColor,'',id),THEMES[id].colors.face);assert.equal(colorValue(0x123456,'',id),'#563412');}});
test('restricted bundler supports local export lists and relative aliases',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vb6-bundle-'));try{fs.writeFileSync(path.join(dir,'a.js'),'export const n=7;\n');fs.writeFileSync(path.join(dir,'b.js'),"import {n as value} from './a.js';\nconst result=value+1;\nexport {result};\n");const context={};vm.runInNewContext(bundle(path.join(dir,'b.js'),'Test'),context);assert.equal(context.Test.result,8);fs.writeFileSync(path.join(dir,'bad.js'),"export * from './a.js';\n");assert.throws(()=>bundle(path.join(dir,'bad.js')),/Unsupported export/);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
