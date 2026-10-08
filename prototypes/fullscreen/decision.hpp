#pragma once
#include <cmath>
#include <string>
namespace thoughtline {
struct Rect { double x,y,w,h; };
inline bool valid(Rect r) { return std::isfinite(r.x)&&std::isfinite(r.y)&&std::isfinite(r.w)&&std::isfinite(r.h)&&r.w>0&&r.h>0; }
inline bool intersects(Rect a,Rect b) { return valid(a)&&valid(b)&&a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h; }
inline bool covers(Rect a,Rect b) { return valid(a)&&valid(b)&&a.x<=b.x+1&&a.y<=b.y+1&&a.x+a.w>=b.x+b.w-1&&a.y+a.h>=b.y+b.h-1; }
// This is geometric coverage, not proof of native fullscreen Space membership.
inline std::string geometry(Rect window,Rect display) {
 if(!valid(window)||!valid(display)||!intersects(window,display))return "unknown";
 return covers(window,display)?"blocked":"clear";
}
// Public enum values; quiet-time/Store-app alone do not prove fullscreen.
inline std::string notification(bool ok,int value) {
 if(!ok)return "unknown";
 if(value>=1&&value<=4)return "blocked";
 if(value>=5&&value<=7)return "clear";
 return "unknown";
}
}
