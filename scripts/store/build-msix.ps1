# SPDX-License-Identifier: GPL-3.0-only
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (![Environment]::Is64BitProcess -or $env:OS -ne 'Windows_NT') { throw 'Windows x64 required' }
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $root
function Invoke-Checked([string]$exe, [string[]]$arguments) {
  & $exe @arguments
  if ($LASTEXITCODE -ne 0) { throw "$exe failed: $LASTEXITCODE" }
}
Invoke-Checked 'node' @('scripts/store/stage.cjs', 'preflight')
# Additive output only: the original NSIS and macOS configurations are untouched.
if (Test-Path 'dist/store') { throw 'Existing Store output: refusing to overwrite it' }
Invoke-Checked 'node' @('node_modules/electron-builder/cli.js', '--win', 'dir', '--x64', '--publish', 'never', '--config.directories.output=dist/store')
Invoke-Checked 'node' @('scripts/store/stage.cjs', 'prepare')
$inputReceipt = Get-Content 'dist/store/build-inputs.json' -Raw | ConvertFrom-Json
Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Image]::FromFile((Join-Path $root 'assets/app-icon.png'))
try {
  foreach ($item in @(@('StoreLogo', 50), @('Square44x44Logo', 44), @('Square150x150Logo', 150))) {
    $size = [int]$item[1]
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($source, 0, 0, $size, $size)
      $bitmap.Save((Join-Path $root "dist/store/staging/Assets/$($item[0]).png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $source.Dispose() }
$sdkRoot = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/bin'
$sdk = Get-ChildItem $sdkRoot -Directory | Where-Object { $_.Name -match '^10\.0\.\d+\.0$' -and (Test-Path (Join-Path $_.FullName 'x64/makeappx.exe')) } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (!$sdk) { throw 'Windows SDK MakeAppx not found' }
$makeappx = Join-Path $sdk.FullName 'x64/makeappx.exe'
$candidate = Join-Path $root "dist/store/$($inputReceipt.filename)"
Invoke-Checked $makeappx @('pack', '/d', (Join-Path $root 'dist/store/staging'), '/p', $candidate, '/o')
& (Join-Path $PSScriptRoot 'verify-msix.ps1') -Package $candidate -MakeAppx $makeappx
