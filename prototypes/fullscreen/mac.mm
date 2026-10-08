#import <AppKit/AppKit.h>
#import <CoreGraphics/CoreGraphics.h>
#include "decision.hpp"
#include <chrono>
#include <iostream>
#include <sstream>
#include <string>

static void sample(unsigned int requested, long expectedPid){
 auto start=std::chrono::steady_clock::now();
 @autoreleasepool {
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.001]];
  CGDirectDisplayID target=requested?requested:CGMainDisplayID();
  NSRunningApplication* front=[[NSWorkspace sharedWorkspace] frontmostApplication];
  long pid=front?front.processIdentifier:0;
  const bool expectedMatch=expectedPid>0&&pid==expectedPid;
  std::string state="unknown",reason="no-frontmost-app";
  unsigned int candidates=0;
  CGDirectDisplayID active[64];uint32_t activeCount=0;bool targetActive=false;
  if(CGGetActiveDisplayList(64,active,&activeCount)==kCGErrorSuccess)for(uint32_t n=0;n<activeCount;n++)if(active[n]==target)targetActive=true;
  if(front&&targetActive) {
   CGRect d=CGDisplayBounds(target);thoughtline::Rect display={d.origin.x,d.origin.y,d.size.width,d.size.height};
   CFArrayRef array=CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly|kCGWindowListExcludeDesktopElements,kCGNullWindowID);
   reason=array?"no-front-window-on-target":"window-list-unavailable";
   if(array){
    for(NSDictionary* info in (__bridge NSArray*)array){
     if([info[(id)kCGWindowOwnerPID] longValue]!=pid||[info[(id)kCGWindowLayer] intValue]!=0||[info[(id)kCGWindowAlpha] doubleValue]<=0)continue;
     NSDictionary* bounds=info[(id)kCGWindowBounds];
     CGRect b; if(!bounds||!CGRectMakeWithDictionaryRepresentation((__bridge CFDictionaryRef)bounds,&b))continue;
     thoughtline::Rect window={b.origin.x,b.origin.y,b.size.width,b.size.height};
     if(!thoughtline::intersects(window,display))continue;
     ++candidates;
     std::string result=thoughtline::geometry(window,display);
     // First eligible frontmost-app window is topmost in the public list.
     // Other windows of the same app may cover this display: report ambiguous.
     if(candidates==1){state=result;reason=result=="blocked"?"front-window-covers-target":"front-window-partial-target";}
     else {state="unknown";reason="multiple-front-app-windows-on-target";}
    }
    CFRelease(array);
   }
  }else if(front)reason="target-display-unavailable";
  const double ms=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-start).count();
  std::cout<<"{\"platform\":\"mac\",\"state\":\""<<state<<"\",\"reason\":\""<<reason<<"\",\"displayId\":"<<target<<",\"eligibleWindows\":"<<candidates<<",\"expectedFrontMatch\":"<<(expectedMatch?"true":"false")<<",\"screenCapturePreflightGranted\":"<<(CGPreflightScreenCaptureAccess()?"true":"false")<<",\"latencyMs\":"<<ms<<"}"<<std::endl;
 }
}
int main(){std::string line;while(std::getline(std::cin,line)){if(line=="quit")return 0;std::istringstream in(line);std::string op;unsigned int display=0;long expected=0;in>>op>>display>>expected;if(op=="sample")sample(display,expected);else std::cout<<"{\"state\":\"unknown\",\"reason\":\"invalid-request\"}"<<std::endl;}return 0;}
