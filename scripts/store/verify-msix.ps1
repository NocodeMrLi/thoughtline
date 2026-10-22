# SPDX-License-Identifier: GPL-3.0-only
param([Parameter(Mandatory)][string]$Package, [Parameter(Mandatory)][string]$MakeAppx)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$receipt = Get-Content (Join-Path $root 'dist/store/build-inputs.json') -Raw | ConvertFrom-Json
$expectedPath = Join-Path $root "dist/store/$($receipt.filename)"
if ([IO.Path]::GetFullPath($Package) -cne [IO.Path]::GetFullPath($expectedPath)) { throw 'Unexpected candidate path' }
$unpack = Join-Path $root 'dist/store/verified-unpack'
if (Test-Path $unpack) { throw 'Preserve previous verification output first' }
& $MakeAppx unpack /p $Package /d $unpack /o
if ($LASTEXITCODE -ne 0) { throw 'MakeAppx unpack failed' }
[xml]$xml = Get-Content (Join-Path $unpack 'AppxManifest.xml') -Raw
$n = [Xml.XmlNamespaceManager]::new($xml.NameTable)
$n.AddNamespace('m', 'http://schemas.microsoft.com/appx/manifest/foundation/windows10')
$n.AddNamespace('d', 'http://schemas.microsoft.com/appx/manifest/desktop/windows10')
$n.AddNamespace('c', 'http://schemas.microsoft.com/appx/manifest/com/windows10')
$id = $xml.SelectSingleNode('/m:Package/m:Identity', $n)
if ($id.Name -cne 'NocodeMrli.Thoughtline' -or $id.Publisher -cne 'CN=B5946604-C81F-4CBD-97F9-E2F6C22D124D' -or $id.Version -cne $receipt.storeVersion -or $id.ProcessorArchitecture -cne 'x64') { throw 'Actual package identity mismatch' }
$publisher = $xml.SelectSingleNode('/m:Package/m:Properties/m:PublisherDisplayName', $n)
if ($publisher.InnerText -cne 'NocodeMrli') { throw 'Publisher display name mismatch' }
$app = $xml.SelectSingleNode('/m:Package/m:Applications/m:Application', $n)
if ($app.Id -cne 'App' -or $app.Executable -cne 'app\Thoughtline.exe' -or $app.EntryPoint -cne 'Windows.FullTrustApplication') { throw 'Actual application entry mismatch' }
$toast = $xml.SelectSingleNode('//d:ToastNotificationActivation', $n)
$com = $xml.SelectSingleNode('//c:Class', $n)
if ($toast.ToastActivatorCLSID -cne '5d3acf61-53d7-51af-ad67-05db67eae9e8' -or $com.Id -cne $toast.ToastActivatorCLSID) { throw 'Toast activation identity mismatch' }
$payload = Join-Path $unpack 'app'
$actualFiles = @(Get-ChildItem $payload -Recurse -File)
if ($actualFiles.Count -ne @($receipt.payload.PSObject.Properties).Count) { throw 'Payload file count mismatch' }
foreach ($entry in $receipt.payload.PSObject.Properties) {
  $file = Join-Path $payload $entry.Name
  if (!(Test-Path $file) -or (Get-FileHash $file -Algorithm SHA256).Hash.ToLower() -cne $entry.Value) { throw "Payload mismatch: $($entry.Name)" }
}
Add-Type -AssemblyName System.Drawing
foreach ($asset in @(@('StoreLogo',50),@('Square44x44Logo',44),@('Square150x150Logo',150))) {
  $image = [Drawing.Image]::FromFile((Join-Path $unpack "Assets/$($asset[0]).png"))
  try { if ($image.Width -ne $asset[1] -or $image.Height -ne $asset[1]) { throw 'Store logo dimensions mismatch' } } finally { $image.Dispose() }
}
if (Test-Path (Join-Path $unpack 'AppxSignature.p7x')) { throw 'Upload candidate must be unsigned; test certificate must not be shipped' }
$hash = (Get-FileHash $Package -Algorithm SHA256).Hash.ToLower()
$report = [ordered]@{ schema = 1; sourceSha = $receipt.sourceSha; sourceTree = $receipt.sourceTree; productVersion = $receipt.productVersion; storeVersion = $id.Version; packageName = $id.Name; publisher = $id.Publisher; architecture = $id.ProcessorArchitecture; filename = $receipt.filename; sha256 = $hash; payloadFilesVerified = $actualFiles.Count; unsigned = $true; packageValidation = 'passed'; installationValidation = 'not-yet-run'; physicalAcceptance = $false; storeCertification = 'not-submitted' }
$report | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $root 'dist/store/package-report.json') -Encoding utf8
"$hash  $($receipt.filename)" | Set-Content (Join-Path $root 'dist/store/SHA256SUMS.txt') -Encoding utf8
Write-Host "Verified unsigned Store candidate: $($receipt.filename), $($id.Version), $hash"
