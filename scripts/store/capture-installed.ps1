# SPDX-License-Identifier: GPL-3.0-only
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows' -or !$env:RUNNER_TEMP) { throw 'Disposable Windows runner only' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $root
$identity = Get-Content 'src/shared/storeIdentity.json' -Raw | ConvertFrom-Json
$receipt = Get-Content 'dist/store/build-inputs.json' -Raw | ConvertFrom-Json
$original = Join-Path $root ("dist/store/" + $receipt.filename)
if ((Get-FileHash $original -Algorithm SHA256).Hash.ToLower() -cne '957ad8564f1c6abf40ef77831d25fa7b39a42b2c541d9824f89feb10a1e9121c' -or $receipt.sourceSha -cne '6e798d53c049da88e49ed31872992a1408873b21') { throw 'Frozen package binding mismatch' }
if (Get-AppxPackage -Name $identity.name) { throw 'Existing Store installation: refusing to touch it' }
if (Test-Path (Join-Path $env:APPDATA 'Thoughtline')) { throw 'Existing default profile: refusing to touch it' }
$work = Join-Path $env:RUNNER_TEMP ('Thoughtline-store-check-' + [guid]::NewGuid())
New-Item $work -ItemType Directory | Out-Null
$cert = $null
$trusted = $null
$installedByUs = $false
$cleanupErrors = [System.Collections.Generic.List[string]]::new()
function Invoke-OwnedCleanup([string]$name, [scriptblock]$action) {
  try { & $action } catch { $cleanupErrors.Add($name + ': ' + $_.Exception.Message) }
}
$report = [ordered]@{ sourceSha=$receipt.sourceSha; status='not-run'; scope='Existing frozen MSIX, disposable native Windows screenshot capture'; cleaned=$false }
try {
  $sdk = Get-ChildItem (Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/bin') -Directory | Where-Object { $_.Name -match '^10\.0\.\d+\.0$' -and (Test-Path (Join-Path $_.FullName 'x64/signtool.exe')) } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
  if (!$sdk) { throw 'SignTool missing' }
  $cert = New-SelfSignedCertificate -Type Custom -Subject $identity.publisher -KeyUsage DigitalSignature -FriendlyName 'Thoughtline disposable CI only' -CertStoreLocation 'Cert:\CurrentUser\My' -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3','2.5.29.19={text}')
  $cer = Join-Path $work 'test-only.cer'
  Export-Certificate -Cert $cert -FilePath $cer | Out-Null
  $trusted = Import-Certificate -FilePath $cer -CertStoreLocation 'Cert:\LocalMachine\TrustedPeople'
  $signed = Join-Path $work $receipt.filename
  Copy-Item (Join-Path $root "dist/store/$($receipt.filename)") $signed
  & (Join-Path $sdk.FullName 'x64/signtool.exe') sign /fd SHA256 /sha1 $cert.Thumbprint $signed
  if ($LASTEXITCODE -ne 0) { throw 'Test-only signing failed' }
  Add-AppxPackage -Path $signed -ErrorAction Stop
  $installedByUs = $true
  $package = Get-AppxPackage -Name $identity.name
  if ($package.PackageFamilyName -cne $identity.packageFamilyName -or $package.Version.ToString() -cne $receipt.storeVersion) { throw 'Registered package identity mismatch' }
  $report.packageFamilyName = $package.PackageFamilyName
  $exe = Join-Path $package.InstallLocation 'app/Thoughtline.exe'
  & node scripts/store/capture-assets.cjs $exe
  if ($LASTEXITCODE -ne 0) { throw 'Native screenshot capture failed' }
  $report.status = 'passed'
} catch {
  $report.status = 'failed'
  $report.error = $_.Exception.ToString()
  # Hosted Server sessions sometimes cannot sideload any app. Keep that gap visible.
  if ($report.error -match '0x80073CFF|0x80073D01|0x80073CF9|0x80070520|0x80070032') { $report.status = 'unsupported-host-session' }
 } finally {
  try {
    Invoke-OwnedCleanup 'package' {
      # The exact package was absent before this test; also handle partial Add-AppxPackage success.
      Get-AppxPackage -Name $identity.name -ErrorAction Stop | Where-Object { $_.PackageFamilyName -ceq $identity.packageFamilyName } | Remove-AppxPackage -ErrorAction Stop
    }
    Invoke-OwnedCleanup 'trust' { if ($trusted) { Remove-Item ('Cert:\LocalMachine\TrustedPeople\' + $trusted.Thumbprint) -ErrorAction Stop } }
    Invoke-OwnedCleanup 'private certificate' { if ($cert) { Remove-Item ('Cert:\CurrentUser\My\' + $cert.Thumbprint) -ErrorAction Stop } }
    Invoke-OwnedCleanup 'temporary files' { if (Test-Path $work) { Remove-Item $work -Recurse -Force -ErrorAction Stop } }
    Invoke-OwnedCleanup 'profile' {
      $profile = Join-Path $env:APPDATA 'Thoughtline'
      if ($installedByUs -and (Test-Path $profile)) { Remove-Item $profile -Recurse -Force -ErrorAction Stop }
    }
    Invoke-OwnedCleanup 'verify' { if ((Test-Path $work) -or (Get-AppxPackage -Name $identity.name -ErrorAction Stop)) { throw 'Owned install resources remain' } }
  } finally {
    $report.cleanupErrors = @($cleanupErrors.ToArray())
    $report.cleaned = $cleanupErrors.Count -eq 0
    $report | ConvertTo-Json -Depth 6 | Set-Content 'dist/store/screenshot-install-report.json' -Encoding utf8
  }
}
Write-Host ($report | ConvertTo-Json -Compress)
if ($report.status -eq 'failed' -or !$report.cleaned) { throw 'Installed validation failed; preserve candidate and reports without marking acceptance' }
