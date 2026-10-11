#import <AppKit/AppKit.h>
#import <CoreGraphics/CoreGraphics.h>
#include <node_api.h>
static napi_value read(napi_env env,napi_callback_info info){size_t argc=1;napi_value a[1];napi_get_cb_info(env,info,&argc,a,nullptr,nullptr);void* p;size_t n;napi_get_buffer_info(env,a[0],&p,&n);NSView* view=(__bridge NSView*)(*(void**)p);NSWindow* w=view.window;napi_value r;napi_create_object(env,&r);
#define B(k,v) {napi_value x;napi_get_boolean(env,v,&x);napi_set_named_property(env,r,k,x);}
 B("fullScreenAuxiliary",(w.collectionBehavior&NSWindowCollectionBehaviorFullScreenAuxiliary)!=0);B("onActiveSpace",w.onActiveSpace);B("nonactivating",(w.styleMask&NSWindowStyleMaskNonactivatingPanel)!=0);B("visible",w.visible);
 napi_value level;napi_create_int32(env,(int)w.level,&level);napi_set_named_property(env,r,"level",level);return r;}
static napi_value init(napi_env env,napi_value exports){napi_value f;napi_create_function(env,"read",4,read,nullptr,&f);napi_set_named_property(env,exports,"read",f);return exports;}NAPI_MODULE(window_state,init)
