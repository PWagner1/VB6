import test from 'node:test';
import assert from 'node:assert/strict';
import {compileWin32,extractNativeDeclarations} from '../src/native/compiler.js';
import {storageLayout} from '../src/native/storage.js';
import {nativeParameterBytes} from '../src/native/numeric.js';
import {nativeCurrencyMethods} from '../src/native/currency.js';
import {BinarySection} from '../src/native/pe32.js';
import {newProject} from '../src/project/model.js';
import {currencyFixture} from '../tools/win32-currency-fixtures.mjs';
function project(code){const p=newProject('Money');p.startup='Sub Main';p.modules=[{id:'m',name:'Money',kind:'module',code}];return p;}
function compile(body,decl=''){return compileWin32(project(`${decl}\nPublic Sub Main()\n${body}\nEnd Sub`));}
const fail=message=>{throw Error(message);};

test('Currency literal payload retains all 64 bits including the signed limits',()=>{
  const c={ro:new BinarySection('.rdata',0),fail};
  for(const [value,raw]of [['900719925474.0993',9007199254740993n],['922337203685477.5807',9223372036854775807n],['-922337203685477.5808',-9223372036854775808n],['1.00005',10000n],['1.00015',10002n],['-1.00015',-10002n]]){
    const label=nativeCurrencyMethods.currencyLiteral.call(c,value),offset=c.ro.labels.get(label),bytes=Uint8Array.from(c.ro.bytes);
    assert.equal(new DataView(bytes.buffer).getBigInt64(offset,true),raw);
    assert.equal(nativeCurrencyMethods.currencyLiteral.call(c,value),label);
  }
});
for(const value of ['922337203685477.5808','-922337203685477.5809','Infinity','NaN','x'])test('invalid Currency literal: '+value,()=>{
  assert.throws(()=>nativeCurrencyMethods.currencyLiteral.call({ro:new BinarySection('.r',0),fail},value),/invalid|range/);
});
test('Currency storage, fixed-array and ABI sizes are eight bytes, not pointers',()=>{
  const decl={name:'c',type:'Currency',bounds:null};storageLayout({fail},decl,{});assert.equal(decl.nativeBytes,8);assert.equal(decl.nativeElementBytes,8);
  assert.equal(nativeParameterBytes({type:'Currency',byRef:false}),8);
  assert.equal(nativeParameterBytes({type:'Currency',byRef:true}),4);
  assert.equal(nativeParameterBytes({type:'Currency',byRef:true,bounds:[]}),4);
  const a={name:'a',type:'Currency',bounds:[[{kind:'literal',value:0},{kind:'literal',value:131072}]]};assert.throws(()=>storageLayout({fail},a,{}),/MiB/);
});
test('Currency Declare signature preserves value and reference ABI',()=>{
  const d=extractNativeDeclarations({name:'M',code:'Private Declare Function Cy Lib "test" (ByVal a As Currency, ByRef b As Currency, ByVal c As Double) As Currency'}).declarations.get('cy');
  assert.equal(d.returnType,'Currency');assert.deepEqual(d.params.map(p=>nativeParameterBytes(p)),[8,4,8]);
});
test('Currency scalar, return, constants and arrays build deterministic no-extraction PE',()=>{
  const {project:p,checks}=currencyFixture(),before=JSON.stringify(p),r=compileWin32(p);
  assert.equal(JSON.stringify(p),before);assert.equal(r.report.extraction,false);assert.equal(r.report.format,'PE32');
  assert.ok(checks.length>=60);assert.deepEqual(r.bytes,compileWin32(p).bytes);
  const names=r.report.imports.map(i=>i.symbol);
  for(const name of ['VarCyAdd','VarCySub','VarCyMul','VarCyCmp','VarCyCmpR8','VarCyRound','VarCyFromStr','VarCyFromR8','VarI4FromCy','VarBstrFromCy','SafeArrayCreate'])assert.ok(names.includes(name),name);
  assert.ok(!names.some(n=>/msvbvm/i.test(n)));assert.ok(r.report.sourceMap.some(m=>m.procedure==='Recursive'));
});
for(const expression of ['CCur()','CCur(1,2)','Abs(1@,2)','Fix(1@,2)','Int(1@,2)','Sgn(1@,2)','CInt(1@,2)','CBool(1@,2)','CSng(1@,2)','Round(1@,2,3)','VarType()','TypeName(1@,2)'])test('Currency builtin arity: '+expression,()=>{
  assert.throws(()=>compile('Dim a As Currency\na = '+expression),/expects/);
});
for(const type of ['Double','Long','Single','String'])test('Currency ByRef rejects mismatched '+type+' storage',()=>{
  assert.throws(()=>compile(`Dim a As ${type}\nChange a`,'Private Sub Change(a As Currency)\nEnd Sub'),/exact/);
  assert.throws(()=>compile(`Dim a() As ${type}\nChange a`,'Private Sub Change(a() As Currency)\nEnd Sub'),/exact/);
});
test('Currency lower limit unary literal compiles; out-of-range literal fails',()=>{
  compile('Dim a As Currency\na = -922337203685477.5808@');
  assert.throws(()=>compile('Dim a As Currency\na = 922337203685477.5808@'),/range|Overflow/);
  assert.throws(()=>compile('Dim a As Currency\na = -922337203685477.5809@'),/range|Overflow/);
});
test('Currency stack return path transfers both registers after cleanup',()=>{
  const r=compile('Dim c As Currency\nc = Identity(1.0001@)','Private Function Identity(ByVal value As Currency) As Currency\nIdentity = value\nEnd Function');
  // MOV EDX,[EAX+4]; MOV EAX,[EAX] before the stdcall epilogue; no ST(0) return.
  assert.ok(Buffer.from(r.bytes).includes(Buffer.from([0x8b,0x50,4,0x8b,0x00,0x5f,0x5e,0x5b,0x89,0xec,0x5d,0xc2,8,0])));
});
test('Currency primitive queries and conversions compile in scalar and array contexts',()=>{
  compile('Dim a As Currency, b() As Currency, s As String, n As Long\ns = TypeName(a)\nn = VarType(b)\nn = LenB(a)\na = CCur("0.0001")\nn = CBool(a)');
});
test('Currency support does not silently admit unsupported Variant or Decimal storage',()=>{
  for(const type of ['Variant','Decimal','Object'])assert.throws(()=>compile(`Dim a As ${type}`),/storage|Variant subtype/);
});

test('Currency suffix and DefCur storage retain the Currency ABI',()=>{
  const a=compile('Dim amount@\namount@ = Identity(0.0001@)\nIf amount@ <> 0.0001@ Then Error 5','Private Function Identity(ByVal value As Currency) As Currency\nIdentity = value\nEnd Function');
  assert.equal(a.report.format,'PE32');
  const b=compile('Dim amount\namount = 0.0001@','DefCur A-C');
  assert.ok(b.bytes.length);
});
test('native type queries reject untyped numeric literals instead of inventing VB subtype metadata',()=>{
  for(const expression of ['VarType(1)','TypeName(1.5)'])assert.throws(()=>compile('Dim result As String\nresult = CStr('+expression+')'),/explicitly typed/);
});
