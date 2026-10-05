import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {NativeAutomationClient} from './native-automation.mjs';
import {VirtualMachine} from '../../src/runtime/vm.js';
import {compileProject} from '../../src/language/compiler.js';
const client=new NativeAutomationClient({allowed:['Scripting.Dictionary','Msxml2.DOMDocument.6.0'],allowNativeCode:true,architecture:process.env.VB6_COM_ARCH||'x86'});
const checks=[],check=(name,fn)=>{fn();checks.push(name);};
try{
  const info=await client.start();check('STA bitness',()=>{assert.equal(info.bitness,process.env.VB6_COM_ARCH==='x64'?64:32);assert.equal(info.apartment,'STA');});
  const output=[],program=compileProject({name:'NativeInterop',startup:'Sub Main',modules:[{name:'M',kind:'module',code:`Option Explicit
Sub Main()
Dim d As Object, other As Object, doc As Object, n As Variant, values As Variant
Set d = CreateObject("Scripting.Dictionary")
d.Add "key", "Zażółć 日本語"
Debug.Print d.Count, d("key")
d.Item("key") = "updated"
Debug.Print CallByName(d, "Item", vbGet, "key")
Set other = CreateObject("Scripting.Dictionary")
other.Add "nested", 7
Set d.Item("object") = other
Dim same As Object
Set same = d("object")
Debug.Print same Is other
values = d.Keys
Debug.Print UBound(values), values(0)
Dim k As Variant
For Each k In d
Debug.Print k
Next k
Set doc = CreateObject("Msxml2.DOMDocument.6.0")
doc.async = False
Debug.Print doc.loadXML("<root>Unicode Żółć</root>")
Debug.Print doc.documentElement.text
Set same = Nothing
Set other = Nothing
Set d = Nothing
Set doc = Nothing
End Sub`}]});
  check('VB compiler',()=>assert.deepEqual(program.diagnostics,[]));
  const vm=new VirtualMachine(program,{automation:client.registry(),print:s=>output.push(s)});
  await vm.start();check('actual native VB execution',()=>assert.deepEqual(output,['1 Zażółć 日本語','updated','-1','1 key','key','object','-1','Unicode Żółć']));
  check('objects allocated',()=>assert.ok(client.adapters.size>=4));vm.stop();await vm.automationClose;
  const status=await client.request({op:'info'});check('native objects released at stop',()=>assert.equal(status.objects,0));
  await assert.rejects(()=>client.request({op:'create',progId:'WScript.Shell'}),/not allowed/);checks.push('ungranted ProgID denied');
  const d=await client.request({op:'create',progId:'Scripting.Dictionary'});
  await client.request({op:'call',handle:d.id,member:'Add',mode:1,args:[{t:'string',v:'currency'},{t:'currency',v:'123.4567'}]});
  const r=await client.request({op:'call',handle:d.id,member:'Item',mode:2,args:[{t:'string',v:'currency'}]});check('exact native currency value',()=>assert.equal(String(r.value.v),'123.4567'));
  await client.request({op:'release',handle:d.id});await assert.rejects(()=>client.request({op:'call',handle:d.id,member:'Count',mode:2}),e=>e.number===91);checks.push('released handle rejected');
  await fs.mkdir('reports/native-interop',{recursive:true});await fs.writeFile(`reports/native-interop/${client.architecture}.json`,JSON.stringify({info,checks,output,licensedVB6:false,activeXPreviewTested:false},null,2));console.log(JSON.stringify({passed:checks.length,checks,info},null,2));
}finally{await client.close();}
