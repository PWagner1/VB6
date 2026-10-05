from pathlib import Path
root=Path.cwd()
p=root/'src/native/storage.js';s=p.read_text()
s=s.replace("    if (decl.parameter || !decl.bounds.length) compiler.fail('Dynamic arrays and whole-array parameters are not yet lowered by the native target', module);", "    decl.nativeArray = true;\n    decl.nativeDynamic = !decl.bounds.length;\n    if (decl.parameter && (!decl.byRef || decl.bounds.length)) compiler.fail('Native array parameters must be unsized and ByRef', module);")
s=s.replace('  decl.nativeCount = count;\n  decl.nativeBytes = Math.ceil(count * elementBytes / 4) * 4;', '  decl.nativeCount = decl.nativeDynamic ? 0 : count;\n  decl.nativeDataBytes = decl.nativeDynamic ? 0 : count * elementBytes;\n  // Arrays own a SAFEARRAY pointer; backing storage is allocated by OleAut32.\n  decl.nativeBytes = decl.nativeArray ? 4 : Math.ceil(count * elementBytes / 4) * 4;')
s=s.replace("    if (variable.nativeBounds && !variable.elementOf) this.fail('Whole-array assignment is not yet lowered by the native target');", "    if (variable.nativeArray && !variable.elementOf) this.fail('Whole-array values require array assignment or a ByRef array parameter');")
s=s.replace("    this.x.push(variable.nativeCount || 1); this.rawStorageAddress(variable); this.x.push().call('native:string:clear');", "    if (variable.nativeArray) return this.destroyArrayStorage(variable);\n    this.x.push(variable.nativeCount || 1); this.rawStorageAddress(variable); this.x.push().call('native:string:clear');")
s=s.replace("    if (key(variable.type) !== 'string' || !variable.fixedLength", "    if (variable.nativeArray) return this.initializeArrayStorage(variable);\n    if (key(variable.type) !== 'string' || !variable.fixedLength")
start=s.index('  elementAddress(variable) {');end=s.index('  zeroStorage(variable)', start)
s=s[:start]+s[end:]
start=s.index('  arrayBoundCall(node, upper) {');end=s.index('  stringBuiltin(node, name)', start)
s=s[:start]+s[end:]
s=s.replace("this.address(variable);x.emit(0x8b,0x00);", "const pin=this.address(variable);x.emit(0x8b,0x00);this.releaseArrayPin(pin);")
p.write_text(s)
p=root/'src/native/compiler.js';s=p.read_text()
s=s.replace("import {NATIVE_ERROR_FRAME_BYTES", "import {nativeArrayMethods,emitNativeArrayHelpers} from './arrays.js';\nimport {NATIVE_ERROR_FRAME_BYTES")
s=s.replace("proc.params.forEach((p,i) => { this.scalar({...p,parameter:true});", "proc.params.forEach((p,i) => { p=this.scalar({...p,parameter:true});")
s=s.replace("if(array?.nativeBounds){if(node.args.length!==array.nativeBounds.length)","if(array?.nativeArray){if(!node.args.length)return array;if(!array.nativeDynamic&&node.args.length!==array.nativeBounds.length)")
s=s.replace("if(!variable)this.fail('Expression is not addressable'); if(variable.elementOf)this.elementAddress(variable);else this.rawStorageAddress(variable);", "if(!variable)this.fail('Expression is not addressable'); if(variable.elementOf)return this.elementAddress(variable); this.rawStorageAddress(variable);return null;")
s=s.replace("if(variable.nativeBounds&&!variable.elementOf)this.fail('Array requires indices: '+variable.name);\n    this.address(variable);", "if(variable.nativeArray&&!variable.elementOf)this.fail('Array requires indices: '+variable.name);\n    const pin=this.address(variable);")
s=s.replace("    if(type==='string'){this.x.push().call('native:string:copy');this.ownString();}\n  }", "    if(type==='string'){this.x.push().call('native:string:copy');this.ownString();}\n    this.releaseArrayPin(pin);\n  }")
s=s.replace("      this.x.push();this.address(variable);this.x.push().call('native:string:assign');return;", "      this.x.push();const pin=this.address(variable);this.x.push().call('native:string:assign');this.releaseArrayPin(pin);return;")
s=s.replace("this.check(variable.type); this.x.push(); this.address(variable);", "this.check(variable.type); this.x.push(); const pin=this.address(variable);")
s=s.replace("this.x.emit(0x89,0xd0); }", "this.x.emit(0x89,0xd0);this.releaseArrayPin(pin); }")
old="""      if (param.byRef) { if(args[i].kind==='group') this.fail('Parenthesized ByRef temporaries are not yet lowered'); const v = this.variable(args[i]); if (!v || v.nativeBounds&&!v.elementOf || key(v.type) !== key(param.type)) this.fail('ByRef native argument must be a scalar of the exact declared type');if(v.fixedLength)this.fail('Fixed-length String ByRef copy-back is not yet lowered'); this.address(v); }"""
new="""      if (param.bounds !== null && param.bounds !== undefined) {
        const array=this.variable(args[i]);
        if(!target.proc || !param.byRef || !array?.nativeArray || array.elementOf || key(array.type)!==key(param.type))this.fail('ByRef array argument must have the exact declared element type');
        if(array.fixedLength)this.fail('Fixed-length String whole-array arguments are not yet lowered');
        this.rawStorageAddress(array);
      } else if (param.byRef) { if(args[i].kind==='group') this.fail('Parenthesized ByRef temporaries are not yet lowered'); const v = this.variable(args[i]); if (!v || v.nativeArray&&!v.elementOf || key(v.type) !== key(param.type)) this.fail('ByRef native argument must be a scalar of the exact declared type');if(v.fixedLength)this.fail('Fixed-length String ByRef copy-back is not yet lowered'); this.address(v); }"""
assert old in s;s=s.replace(old,new)
s=s.replace('x.sequence=outer.sequence;context.stringTemps=[];', 'x.sequence=outer.sequence;context.stringTemps=[];context.arrayPins=[];')
s=s.replace('if (variable) { this.storageExpression(variable,ins.expr); this.store(variable); }', 'if (variable?.nativeArray && !variable.elementOf) this.assignArrayStorage(variable,ins.expr);\n        else if (variable) { this.storageExpression(variable,ins.expr); this.store(variable); }')
s=s.replace("      else if(ins.op==='erase')", "      else if(ins.op==='redim'){for(const decl of ins.decls)this.redimArrayStorage(decl,ins.preserve);}\n      else if(ins.op==='erase')")
s=s.replace("    for(const variable of context.locals.values())if(key(variable.type)==='string'&&!variable.label&&(!variable.parameter||!variable.byRef))this.clearStringStorage(variable);", "    for(const variable of context.locals.values())if(!variable.label&&!variable.parameter){if(variable.nativeArray)this.destroyArrayStorage(variable);else if(key(variable.type)==='string')this.clearStringStorage(variable);}")
s=s.replace("x.label(context.label+':clear-strings');for(const variable of context.stringTemps)","x.label(context.label+':clear-strings');for(const pin of context.arrayPins)this.releaseArrayPin(pin);for(const variable of context.stringTemps)")
s=s.replace('[...context.locals.values(),...context.stringTemps]', '[...context.locals.values(),...context.stringTemps,...context.arrayPins]')
s=s.replace('      if(!variable.label)this.initializeFixedString(variable);', '      if(!variable.label || variable.nativeArray)this.initializeFixedString(variable);')
s=s.replace('    emitNativeStorageHelpers(this);','    emitNativeStorageHelpers(this);\n    emitNativeArrayHelpers(this);')
s=s.replace('nativeStorageMethods,nativeErrorMethods','nativeStorageMethods,nativeErrorMethods,nativeArrayMethods')
s=s.replace('Typed integer/String storage and fixed arrays; unsupported VB constructs fail compilation.', 'Typed integer/String storage, fixed/dynamic arrays and error recovery; unsupported VB constructs fail compilation.')
p.write_text(s)
p=root/'src/native/errors.js';s=p.read_text().replace("[9,'Subscript out of range'],", "[9,'Subscript out of range'],[10,'This array is fixed or temporarily locked'],")
p.write_text(s)
p=root/'src/native/compiler.js';s=p.read_text()
s=s.replace("    for (let i = 0; i < args.length; i++) {\n      const param = signature.params[i];", "    const callPins=[];\n    for (let i = 0; i < args.length; i++) {\n      const param = signature.params[i];")
s=s.replace("this.fail('Fixed-length String ByRef copy-back is not yet lowered'); this.address(v);", "this.fail('Fixed-length String ByRef copy-back is not yet lowered');const pin=this.address(v);if(pin)callPins.push(pin);")
s=s.replace("x.call(target.label);this.checkNativeError();if(key(signature.returnType)", "x.call(target.label);this.checkNativeError();for(const pin of callPins)this.releaseArrayPin(pin);if(key(signature.returnType)")
s=s.replace("x.invoke(target.dll,target.symbol); if (['integer','boolean']", "x.invoke(target.dll,target.symbol);for(const pin of callPins)this.releaseArrayPin(pin); if (['integer','boolean']")
s=s.replace("if(key(variable.type)==='string')this.clearStringStorage(variable);else this.zeroStorage(variable);this.initializeFixedString(variable);", "if(variable.nativeArray)this.destroyArrayStorage(variable);else if(key(variable.type)==='string')this.clearStringStorage(variable);else this.zeroStorage(variable);this.initializeFixedString(variable);")
p.write_text(s)
p=root/'tests/win32-aot.test.mjs';s=p.read_text().replace("['floating storage','Dim n As Double'],['dynamic arrays','Dim n() As Long'],", "['floating storage','Dim n As Double'],['ByVal array parameters','Private Sub F(ByVal n() As Long)\\nEnd Sub'],");p.write_text(s)
p=root/'tests/win32-storage.test.mjs';s=p.read_text().replace('assert.equal(d.nativeBytes,Math.ceil(15*bytes/4)*4);','assert.equal(d.nativeBytes,4);assert.equal(d.nativeDataBytes,15*bytes);assert.equal(d.nativeArray,true);').replace(",['dynamic',[]]",'');p.write_text(s)
p=root/'tools/win32-fixtures.mjs';s=p.read_text().replace("import fs from 'node:fs/promises';", "import fs from 'node:fs/promises';\nimport {win32ArrayFixtures} from './win32-array-fixtures.mjs';").replace('...win32StorageFixtures(),...win32ErrorFixtures()', '...win32StorageFixtures(),...win32ErrorFixtures(),...win32ArrayFixtures()');p.write_text(s)
p=root/'tools/test-win32-aot.ps1';s=p.read_text().replace("@('AotStorage','AotErrors')", "@('AotStorage','AotErrors','AotDynamicArrays')")
s=s.replace("  Check ($name+' self-checking native program exits') ($p.WaitForExit(20000))", """  $exited=$p.WaitForExit(20000)
  if(-not $exited) {
    $diagnostic=@([AotWindowsTest]::Windows($p.Id)|ForEach-Object { [AotWindowsTest]::Text($_); [AotWindowsTest]::Children($_)|ForEach-Object { [AotWindowsTest]::Text($_) } }) -join ' '
    throw ($name+' did not exit; native windows: '+$diagnostic)
  }
  Check ($name+' self-checking native program exits') $exited""");p.write_text(s)

# Refuse any partial or mismatched materialization before committing source.
import hashlib
expected = {'src/native/compiler.js': '8bd9d32abb5aec14aa36f98d0496fb93395467c6c095121151c6223978f23f0c', 'src/native/storage.js': '9c4297fd11fbe141a0c863d70dcf5d658395fd8c52518f95c7601558c20dc15d', 'src/native/errors.js': 'cadf97d3513bb0771757737ba3c982e6106c88d3609ef8de3bbee145c9ef8e0d', 'tests/win32-aot.test.mjs': '73e6be8ac220df36a0e69c870db6d9468fdfb1c2ad602bf6ce72c3895ae1ce9b', 'tests/win32-storage.test.mjs': 'ee2fc47ab74d743b506aee7670b2059def32f33a8bd1280c9461245f25351607', 'tools/win32-fixtures.mjs': '7542a84b4550d808b4a677daea1d6928368b84c962215c0b9f89b8e2f2ecf89a', 'tools/test-win32-aot.ps1': '7d423228072a14be16f05c7fc333eda49d325af268f6b54932ec7fac9bd7bbed', 'src/native/arrays.js': '230699c026029592b7cc099a42a2a0c7fe74c4637e4befac3a1e25e2b7c64f30', 'tools/win32-array-fixtures.mjs': '7c11280d5a55ac70805eb6d8c91b2b4683464c9b4c43e91fc36479179f936599', 'tests/win32-arrays.test.mjs': '002236e69fc6926d1e14b300436fa98a605a198b5c2f6803dade60ebac2b7b9d'}
for name, digest in expected.items():
    actual=hashlib.sha256((root/name).read_bytes()).hexdigest()
    if actual!=digest: raise RuntimeError('Source transfer mismatch: '+name+' '+actual)

p=root/'docs/WIN32-AOT.md';s=p.read_text()
old='Dynamic arrays, ReDim, whole-array arguments/assignment, Variants, floating point, Decimal/Currency, records and class instances remain unsupported.'
assert old in s
s=s.replace(old, 'Dynamic arrays, ReDim/Preserve and exact-type whole-array ByRef calls/assignment are now implemented with owned SAFEARRAY storage; see [Native arrays](WIN32-ARRAYS.md). Variants, floating point, Decimal/Currency, records and class instances remain unsupported.')
p.write_text(s)
