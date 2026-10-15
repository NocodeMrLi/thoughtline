param([ValidateSet('prepare','cursor','capture')][string]$Mode, [string]$Output, [int]$X=0, [int]$Y=0, [int]$Width=0, [int]$Height=0)
$ErrorActionPreference='Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') { throw 'Disposable Windows runner required' }
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class ThoughtlineCaptureDesktop {
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool SystemParametersInfo(int action,int param,string value,int flags);
}
'@
if ($Mode -eq 'prepare') {
  if (Get-Command Set-DisplayResolution -ErrorAction SilentlyContinue) { try { Set-DisplayResolution -Width 1920 -Height 1080 -Force | Out-Null } catch { Write-Host ('Resolution kept: '+$_.Exception.Message) } }
  $wallpaper=Get-ChildItem 'C:/Windows/Web/Wallpaper' -Filter '*.jpg' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'img0.jpg' } | Select-Object -First 1
  if ($wallpaper) { [void][ThoughtlineCaptureDesktop]::SystemParametersInfo(20,0,$wallpaper.FullName,0) }
  try { (New-Object -ComObject Shell.Application).MinimizeAll() } catch { Write-Host 'No Explorer minimize service' }
} elseif ($Mode -eq 'cursor') {
  if (![ThoughtlineCaptureDesktop]::SetCursorPos($X,$Y)) { throw 'Native cursor movement failed' }
} else {
  if (!$Output) { throw 'Output path required' }
  $r=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  if ($Width -gt 0 -and $Height -gt 0) {
    if ($X -lt $r.X -or $Y -lt $r.Y -or ($X+$Width) -gt $r.Right -or ($Y+$Height) -gt $r.Bottom) { throw 'Capture region outside actual desktop' }
    $r=[System.Drawing.Rectangle]::new($X,$Y,$Width,$Height)
  }
  $bitmap=[System.Drawing.Bitmap]::new($r.Width,$r.Height)
  $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
  try { $graphics.CopyFromScreen($r.X,$r.Y,0,0,$r.Size); $bitmap.Save($Output,[System.Drawing.Imaging.ImageFormat]::Png) }
  finally { $graphics.Dispose();$bitmap.Dispose() }
}
