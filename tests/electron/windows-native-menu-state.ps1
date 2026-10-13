param([Parameter(Mandatory=$true)][int]$OwnerPid,[Parameter(Mandatory=$true)][int]$ExpectedCount,[int]$TimeoutMs=5000)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ThoughtlineMenuState {
 [DllImport("user32.dll",EntryPoint="FindWindowExW",CharSet=CharSet.Unicode)] public static extern IntPtr FindWindowEx(IntPtr parent,IntPtr after,IntPtr cls,string caption);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 public static int Count(uint owner) { int count=0;IntPtr window=IntPtr.Zero;
  while((window=FindWindowEx(IntPtr.Zero,window,new IntPtr(0x8000),null))!=IntPtr.Zero){uint pid;GetWindowThreadProcessId(window,out pid);if(pid==owner&&IsWindowVisible(window))count++;}return count; }
 public static uint ForegroundPid(){uint pid;GetWindowThreadProcessId(GetForegroundWindow(),out pid);return pid;}
}
'@
$deadline=[DateTime]::UtcNow.AddMilliseconds($TimeoutMs)
do {
 $count=[ThoughtlineMenuState]::Count([uint32]$OwnerPid)
 $foreground=[ThoughtlineMenuState]::ForegroundPid()
 if($count -eq $ExpectedCount){[pscustomobject]@{menus=$count;expected=$ExpectedCount;ownerPid=$OwnerPid;foregroundPid=$foreground;matched=$true}|ConvertTo-Json -Compress;exit 0}
 Start-Sleep -Milliseconds 25
} while([DateTime]::UtcNow -lt $deadline)
throw "Owned native menu state did not reach $ExpectedCount; actual $count, foreground PID $foreground"
