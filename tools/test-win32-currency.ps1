param([string]$Directory = 'validation/currency')
$ErrorActionPreference = 'Stop'
# Test-only Windows interop. The generated PE contains no CLR or script host.
Add-Type @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class CurrencyWindowsProbe {
 public delegate bool EnumProc(IntPtr window, IntPtr context);
 [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc callback,IntPtr context);
 [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr parent,EnumProc callback,IntPtr context);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint id);
 [DllImport("user32.dll",EntryPoint="SendMessageTimeoutW",CharSet=CharSet.Unicode)] static extern IntPtr TextMessage(IntPtr h,uint m,IntPtr w,StringBuilder text,uint flags,uint timeout,out UIntPtr result);
 static string Text(IntPtr h) {var text=new StringBuilder(2048);UIntPtr result;TextMessage(h,13,(IntPtr)text.Capacity,text,2,200,out result);return text.ToString();}
 public static string Diagnostics(int process) {var values=new List<string>();EnumWindows((h,p)=>{uint id;GetWindowThreadProcessId(h,out id);if(id==process){values.Add(Text(h));EnumChildWindows(h,(c,q)=>{values.Add(Text(c));return true;},IntPtr.Zero);}return true;},IntPtr.Zero);return string.Join(" | ",values);}
}
'@
$report = [ordered]@{ ok=$false; platform=[Environment]::OSVersion.VersionString; hostArchitecture=$env:PROCESSOR_ARCHITECTURE; culture=[Globalization.CultureInfo]::CurrentCulture.Name; executableArchitecture='x86'; checks=@() }
$path = (Resolve-Path $Directory).Path
$plan = Get-Content (Join-Path $path 'currency-build.json') -Raw | ConvertFrom-Json
$source = Join-Path $path 'AotCurrency.exe'
$report.sha256 = (Get-FileHash $source -Algorithm SHA256).Hash.ToLowerInvariant()
$clean = Join-Path ([IO.Path]::GetTempPath()) ('vb6-currency-'+[Guid]::NewGuid().ToString('N'))
$process = [Diagnostics.Process]::new()
try {
 if($report.sha256 -ne $plan.sha256){throw 'Generated executable digest does not match its build manifest'}
 [IO.Directory]::CreateDirectory($clean) | Out-Null
 $exe=Join-Path $clean 'AotCurrency.exe';Copy-Item $source $exe
 if(@(Get-ChildItem $clean).Count -ne 1){throw 'Isolated execution directory was not single-file'}
 $report.checks += 'Copied only the EXE into an empty directory'
 $process.StartInfo.FileName=$exe;$process.StartInfo.WorkingDirectory=$clean;$process.StartInfo.UseShellExecute=$false
 $process.EnableRaisingEvents=$true
 if(-not $process.Start()){throw 'Could not start the Currency executable'}
 $null=$process.Handle
 if(-not $process.WaitForExit(30000)){throw ('Currency execution timed out: '+[CurrencyWindowsProbe]::Diagnostics($process.Id))}
 $report.exitCode=$process.ExitCode
 if($process.ExitCode -ne 0){
  $index=$process.ExitCode
  $meaning=if($index -gt 0 -and $index -le $plan.checks.Count){$plan.checks[$index-1]}elseif($index -eq 240){'Expected array lock error 10 in nested ByRef call'}else{'Native failure or unhandled runtime error'}
  throw "Currency assertion $index failed: $meaning"
 }
 $report.embeddedAssertions=$plan.checks
 $report.checks += "$($plan.checks.Count) numbered native Currency assertions returned success"
 $report.checks += '2,000 recursive Currency and array lifetime cycles completed'
 if(@(Get-ChildItem $clean -Force).Count -ne 1){throw 'Execution extracted unexpected files beside the EXE'}
 $report.checks += 'No adjacent runtime, DLL or extracted application file required'
 $report.ok=$true
} catch {
 $report.error=$_.Exception.Message
 throw
} finally {
 try {if($process.Id -and -not $process.HasExited){$process.Kill();$process.WaitForExit(5000)|Out-Null}}catch{}
 $process.Dispose()
 $report | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $path 'currency-execution.json')
 Remove-Item -Path $clean -Recurse -Force -ErrorAction SilentlyContinue
 $report | ConvertTo-Json -Depth 8 | Write-Host
}
