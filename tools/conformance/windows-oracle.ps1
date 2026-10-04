param([Parameter(Mandatory=$true)][string]$Vectors,[Parameter(Mandatory=$true)][string]$Output)
$ErrorActionPreference='Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'windows-oracle.cs')
$inputData=Get-Content -Raw -Encoding UTF8 $Vectors | ConvertFrom-Json
$results=@()
foreach($v in $inputData.operations){
  try { $result=[WindowsVariantOracle]::Run($v.op,[int]$v.a.type,[string]$v.a.value,[int]$v.b.type,[string]$v.b.value,[int]$v.lcid);$results+=@{id=$v.id;result=$result} }
  catch {$results+=@{id=$v.id;error=$_.Exception.ToString()}}
}
$encodings=@()
foreach($v in $inputData.encodings){
  try{$hex=[WindowsVariantOracle]::Encode([int]$v.page,[string]$v.text);$text=[WindowsVariantOracle]::Decode([int]$v.page,$hex);$encodings+=@{page=$v.page;text=$v.text;hex=$hex;decoded=$text}}
  catch{$encodings+=@{page=$v.page;text=$v.text;error=$_.Exception.ToString()}}
}
$dll=Join-Path $env:WINDIR 'System32\oleaut32.dll'
$report=@{schema=1;oracle='Windows OleAut32 and Kernel32 (NOT VB6 Put certification)';architecture=[IntPtr]::Size*8;os=[Environment]::OSVersion.VersionString;runtimeVersion=[Environment]::Version.ToString();oleaut32Version=(Get-Item $dll).VersionInfo.FileVersion;oleaut32Sha256=(Get-FileHash $dll -Algorithm SHA256).Hash;operations=$results;encodings=$encodings}
$report | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 $Output
