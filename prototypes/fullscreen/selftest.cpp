#include "decision.hpp"
#include <iostream>
#include <limits>
int main(){
 using namespace thoughtline;
 int failures=0,total=0;
 auto check=[&](const std::string& actual,const std::string& expected,const char* name){++total;if(actual!=expected){++failures;std::cerr<<name<<": expected "<<expected<<", got "<<actual<<"\n";}};
 check(geometry({0,30,1440,850},{0,0,1440,900}),"clear","ordinary maximized with menu/work-area excluded");
 check(geometry({0,0,1440,900},{0,0,1440,900}),"blocked","exact primary coverage");
 check(geometry({-1920,0,1920,1080},{-1920,0,1920,1080}),"blocked","negative-origin display");
 check(geometry({-1800,40,900,700},{-1920,0,1920,1080}),"clear","negative-origin normal");
 check(geometry({0,0,1440,900},{1440,0,1440,900}),"unknown","other monitor");
 check(geometry({-10,-10,1460,920},{0,0,1440,900}),"blocked","border bounds outside screen");
 check(geometry({0,0,1438,900},{0,0,1440,900}),"clear","two pixels uncovered");
 check(geometry({0,0,0,900},{0,0,1440,900}),"unknown","empty bounds");
 check(geometry({0,0,1440,900},{0,0,0,900}),"unknown","empty display");
 check(geometry({std::numeric_limits<double>::quiet_NaN(),0,1440,900},{0,0,1440,900}),"unknown","invalid number");
 check(notification(true,1),"blocked","not present");check(notification(true,2),"blocked","busy");
 check(notification(true,3),"blocked","exclusive D3D");check(notification(true,4),"blocked","presentation");
 check(notification(true,5),"clear","accepts");check(notification(true,6),"clear","quiet-time not fullscreen");check(notification(true,7),"clear","Store app not necessarily fullscreen");
 check(notification(true,0),"unknown","invalid enum");check(notification(false,5),"unknown","HRESULT failure");
 std::cout<<"{\"tests\":"<<total<<",\"failures\":"<<failures<<",\"scope\":\"pure geometry and public enum mapping, not native acceptance\"}\n";
 return failures?1:0;
}
