#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <shellapi.h>
#include <dwmapi.h>
#include "decision.hpp"
#include <chrono>
#include <iostream>
#include <string>
static void sample(bool dpiReady){
 auto start=std::chrono::steady_clock::now();
 QUERY_USER_NOTIFICATION_STATE value{};HRESULT hr=SHQueryUserNotificationState(&value);
 std::string signal=thoughtline::notification(SUCCEEDED(hr),static_cast<int>(value));
 std::string state="unknown",reason="notification-query-failed";
 if(signal=="blocked"){state="blocked";reason="public-global-notification-state";}
 else if(signal=="clear"){
  HWND front=GetForegroundWindow();POINT cursor{};
  if(!dpiReady)reason="physical-coordinate-context-unavailable";
  else if(!front||!IsWindowVisible(front)||IsIconic(front))reason="foreground-unavailable";
  else if(!GetCursorPos(&cursor))reason="pointer-unavailable";
  else{
   HMONITOR target=MonitorFromPoint(cursor,MONITOR_DEFAULTTONULL);MONITORINFO monitor{};monitor.cbSize=sizeof(monitor);RECT bounds{};
   if(!target||!GetMonitorInfoW(target,&monitor))reason="target-monitor-unavailable";
   else if(front==GetShellWindow()){state="clear";reason="shell-desktop-notification-clear";}
   else if(FAILED(DwmGetWindowAttribute(front,DWMWA_EXTENDED_FRAME_BOUNDS,&bounds,sizeof(bounds))))reason="dwm-bounds-unavailable";
   else{
    thoughtline::Rect w={double(bounds.left),double(bounds.top),double(bounds.right-bounds.left),double(bounds.bottom-bounds.top)};
    const auto& m=monitor.rcMonitor;thoughtline::Rect d={double(m.left),double(m.top),double(m.right-m.left),double(m.bottom-m.top)};
    state=thoughtline::geometry(w,d);reason=state=="blocked"?"foreground-covers-pointer-monitor":state=="clear"?"foreground-partial-pointer-monitor":"foreground-on-other-monitor";
   }
  }
 }
 double ms=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-start).count();
 std::cout<<"{\"platform\":\"windows\",\"state\":\""<<state<<"\",\"reason\":\""<<reason<<"\",\"notificationQuerySucceeded\":"<<(SUCCEEDED(hr)?"true":"false")<<",\"notificationState\":"<<int(value)<<",\"perMonitorV2\":"<<(dpiReady?"true":"false")<<",\"latencyMs\":"<<ms<<"}"<<std::endl;
}
int main(){bool dpi=SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2)!=FALSE;std::string line;while(std::getline(std::cin,line)){if(line=="quit")return 0;if(line=="sample")sample(dpi);else std::cout<<"{\"state\":\"unknown\",\"reason\":\"invalid-request\"}"<<std::endl;}return 0;}
