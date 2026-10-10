$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows' -or !$env:RUNNER_TEMP) { throw 'Disposable GitHub Windows runner required' }
$install = Join-Path $env:RUNNER_TEMP 'Thoughtline-installer-preflight'
$data = Join-Path $env:APPDATA 'Thoughtline'
if ((Test-Path $install) -or (Test-Path $data)) { throw 'Existing installation/profile: refusing to touch it' }
$installer = @(Get-ChildItem dist -Filter '*.exe')
if ($installer.Count -ne 1) { throw 'Expected exactly one installer' }
function Run-Checked($exe, $arguments) {
  $process = Start-Process -FilePath $exe -ArgumentList $arguments -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Process failed with $($process.ExitCode): $exe" }
}
function Snapshot-Hashes {
  $result = [ordered]@{}
  Get-ChildItem $data -Filter 'snapshot*.json' | Sort-Object Name | ForEach-Object { $result[$_.Name] = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower() }
  $locationConfig = Join-Path $data 'data-location.json'
  if (Test-Path $locationConfig) { $result['data-location.json'] = (Get-FileHash $locationConfig -Algorithm SHA256).Hash.ToLower() }
  $result['preflight-marker.txt'] = (Get-FileHash (Join-Path $data 'preflight-marker.txt') -Algorithm SHA256).Hash.ToLower()
  return ($result | ConvertTo-Json -Compress)
}
$report = [ordered]@{ headSha = $env:GITHUB_SHA; scope = 'Disposable Windows runner NSIS current-user install/reinstall/ordinary uninstall; not physical acceptance'; passed = $false }
try {
  node scripts/windows-installed-preflight.cjs seed
  if ($LASTEXITCODE -ne 0) { throw 'Fixture creation failed' }
  $seed = Snapshot-Hashes
  Run-Checked $installer[0].FullName "/S /currentuser /D=$install"
  $exe = Join-Path $install 'Thoughtline.exe'
  if (!(Test-Path $exe)) { throw 'Installed executable missing' }
  if ((Snapshot-Hashes) -ne $seed) { throw 'Fresh install changed pre-existing fixture data' }
  $report.installPreservesExistingData = $true
  $isolated = Join-Path $env:LOCALAPPDATA 'Thoughtline-Preflight\0.0.18\user-data'
  if (Test-Path $isolated) { throw 'Unexpected existing isolation fixture' }
  & ./docs/delivery/Start-Thoughtline-Isolated.ps1 -Executable $exe -CheckOnly
  if (Test-Path $isolated) { throw 'Check-only launcher created a profile' }
  $report.isolationLauncherCheckOnly = $true
  $report.appFileVersion = (Get-Item $exe).VersionInfo.FileVersion
  $report.appProductVersion = (Get-Item $exe).VersionInfo.ProductVersion
  $report.appSignature = [string](Get-AuthenticodeSignature $exe).Status
  $report.installerSignature = [string](Get-AuthenticodeSignature $installer[0].FullName).Status
  if ($report.appSignature -ne 'NotSigned' -or $report.installerSignature -ne 'NotSigned') { throw 'Unexpected signing status for unsigned preflight' }
  $uninstaller = Join-Path $install 'Uninstall Thoughtline.exe'
  node scripts/verify-windows-pe-icons.cjs $exe $installer[0].FullName $uninstaller
  if ($LASTEXITCODE -ne 0) { throw 'Embedded PE icon verification failed' }
  $report.approvedIconsEmbeddedInAppInstallerUninstaller = $true
  node scripts/windows-installed-preflight.cjs verify $exe
  if ($LASTEXITCODE -ne 0) { throw 'Packaged application preflight failed' }
  $priorAppearanceExecutable = $env:THOUGHTLINE_EXECUTABLE
  $priorAppearanceEvidence = $env:THOUGHTLINE_EVIDENCE_DIR
  try {
    $env:THOUGHTLINE_EXECUTABLE = $exe
    $env:THOUGHTLINE_EVIDENCE_DIR = 'acceptance/evidence/appearance/windows-packaged'
    New-Item -ItemType Directory -Force $env:THOUGHTLINE_EVIDENCE_DIR | Out-Null
    & node tests/electron/packaged-appearance.cjs 2>&1 | Tee-Object -FilePath (Join-Path $env:THOUGHTLINE_EVIDENCE_DIR 'workflow.log')
    if ($LASTEXITCODE -ne 0) { throw 'Actual installed package appearance preflight failed' }
    $report.packagedEnglishAppearance = $true
    $env:THOUGHTLINE_EVIDENCE_DIR = 'acceptance/evidence/round2/windows/packaged-split'
    & node tests/electron/packaged-split-menu.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Actual installed package split menu failed' }
    $report.packagedSplitMenu = $true
    $env:THOUGHTLINE_EVIDENCE_DIR = 'acceptance/evidence/top-edge-20261010/windows-packaged'
    $priorTopEdgeVerify = $env:THOUGHTLINE_VERIFY
    try {
      $env:THOUGHTLINE_VERIFY = '1'
      & node tests/electron/top-edge-probe.cjs
      if ($LASTEXITCODE -ne 0) { throw 'Actual installed Windows top edge regression failed' }
      $report.packagedTopEdgeGeometryAndPointerPath = $true
    } finally { $env:THOUGHTLINE_VERIFY = $priorTopEdgeVerify }
  } finally {
    $env:THOUGHTLINE_EXECUTABLE = $priorAppearanceExecutable
    $env:THOUGHTLINE_EVIDENCE_DIR = $priorAppearanceEvidence
  }
  $before = Snapshot-Hashes
  Run-Checked $installer[0].FullName "/S /currentuser /D=$install"
  if ((Snapshot-Hashes) -ne $before) { throw 'Reinstall changed saved fixture data' }
  $report.sameVersionReinstallPreservesData = $true
  $uninstaller = Join-Path $install 'Uninstall Thoughtline.exe'
  if (!(Test-Path $uninstaller)) { throw 'Uninstaller missing' }
  Run-Checked $uninstaller "/S /currentuser _?=$install"
  if (Test-Path $exe) { throw 'Application executable remained after uninstall' }
  if ((Snapshot-Hashes) -ne $before) { throw 'Ordinary uninstall removed or changed saved fixture data' }
  $report.ordinaryUninstallPreservesData = $true
  $report.retainedSnapshotHashes = (Snapshot-Hashes | ConvertFrom-Json)
  $report.passed = $true
} finally {
  $report | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 dist/windows-installer-preflight.json
  # Only this runner's known synthetic profile is eligible for cleanup.
  $marker = Join-Path $data 'preflight-marker.txt'
  if ((Test-Path $marker) -and (Get-Content $marker -Raw) -eq 'thoughtline-disposable-windows-preflight') { Remove-Item $data -Recurse -Force }
}
