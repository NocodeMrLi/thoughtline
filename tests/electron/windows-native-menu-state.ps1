param([Parameter(Mandatory=$true)][int]$OwnerPid,[Parameter(Mandatory=$true)][int]$ExpectedCount,[string]$BrowserHandles='', [int]$TimeoutMs=5000)
$ErrorActionPreference='Stop'
# Electron 44 uses Chromium Views MenuRunner, not the Win32 #32768 menu class.
# Enumerate owned visible top-level HWNDs, excluding the actual BrowserWindow HWNDs.
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class ThoughtlineMenuState {
 public delegate bool WindowCallback(IntPtr window, IntPtr data);
 [DllImport("user32.dll")] public static extern bool EnumWindows(WindowCallback callback,IntPtr data);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr window,StringBuilder value,int max);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr window,StringBuilder value,int max);
 public class WindowInfo { public string handle; public string className; public string title; }
 public static WindowInfo[] Windows(uint owner) { var result=new List<WindowInfo>();
  EnumWindows(delegate(IntPtr window,IntPtr data){uint pid;GetWindowThreadProcessId(window,out pid);if(pid==owner&&IsWindowVisible(window)){var cls=new StringBuilder(256);var text=new StringBuilder(512);GetClassName(window,cls,256);GetWindowText(window,text,512);result.Add(new WindowInfo {handle=window.ToInt64().ToString(),className=cls.ToString(),title=text.ToString()});}return true;},IntPtr.Zero);return result.ToArray(); }
 public static uint ForegroundPid(){uint pid;GetWindowThreadProcessId(GetForegroundWindow(),out pid);return pid;}
}
'@
$known=$BrowserHandles.Split(',')
$deadline=[DateTime]::UtcNow.AddMilliseconds($TimeoutMs)
do {
 $windows=@([ThoughtlineMenuState]::Windows([uint32]$OwnerPid))
 $menus=@($windows|Where-Object {$known -notcontains $_.handle})
 $foreground=[ThoughtlineMenuState]::ForegroundPid()
 if($menus.Count -eq $ExpectedCount){[pscustomobject]@{menus=$menus.Count;expected=$ExpectedCount;ownerPid=$OwnerPid;foregroundPid=$foreground;windows=$windows;menuWindows=$menus;browserHandles=$known;matched=$true}|ConvertTo-Json -Compress -Depth 5;exit 0}
 Start-Sleep -Milliseconds 25
} while([DateTime]::UtcNow -lt $deadline)
$diagnostic=[pscustomobject]@{menus=$menus.Count;expected=$ExpectedCount;ownerPid=$OwnerPid;foregroundPid=$foreground;windows=$windows;browserHandles=$known}|ConvertTo-Json -Compress -Depth 5
throw "Owned Views menu state did not reach expected count: $diagnostic"
