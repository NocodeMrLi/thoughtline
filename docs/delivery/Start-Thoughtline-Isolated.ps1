param(
  [Parameter(Mandatory=$true)][string]$Executable,
  [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$exe = (Resolve-Path -LiteralPath $Executable).Path
if ((Split-Path $exe -Leaf) -ne 'Thoughtline.exe') { throw 'Select the installed Thoughtline.exe' }
if ((Get-Item -LiteralPath $exe).VersionInfo.FileVersion -ne '0.0.37') { throw 'This launcher requires the 0.0.37 functional preflight executable' }
if (!$env:LOCALAPPDATA) { throw 'Windows LOCALAPPDATA is unavailable' }
if (Get-Process -Name Thoughtline -ErrorAction SilentlyContinue) { throw 'Exit other Thoughtline versions from their tray menus first. No processes were stopped.' }
$data = Join-Path $env:LOCALAPPDATA 'Thoughtline-Preflight\0.0.37\user-data'
$normal = Join-Path $env:APPDATA 'Thoughtline'
if ($data -eq $normal) { throw 'Isolated profile must differ from the normal profile' }
Write-Output "Executable: $exe"
Write-Output "Isolated data: $data"
Write-Output 'This isolates notes. The installer still uses the same app identity and can replace an existing installed version.'
if ($CheckOnly) { Write-Output 'Check only: no data directory or app process created.'; return }
New-Item -ItemType Directory -Path $data -Force | Out-Null
$previous = $env:THOUGHTLINE_DATA_DIR
try {
  $env:THOUGHTLINE_DATA_DIR = $data
  $process = Start-Process -FilePath $exe -PassThru
  Write-Output "Launch requested (PID $($process.Id)). Verify the tray, version and isolated notes in the app."
} finally {
  if ($null -eq $previous) { Remove-Item Env:THOUGHTLINE_DATA_DIR -ErrorAction SilentlyContinue } else { $env:THOUGHTLINE_DATA_DIR = $previous }
}
