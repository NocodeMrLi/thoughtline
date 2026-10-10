#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#include <node_api.h>
#include <stdlib.h>
#include <string.h>

static void callback(napi_env env,napi_value js,void* context,void* data){
 char* value=(char*)data;if(env&&js){napi_value arg,global;napi_create_string_utf8(env,value,NAPI_AUTO_LENGTH,&arg);napi_get_global(env,&global);napi_call_function(env,global,js,1,&arg,nullptr);}free(value);
}
static void deliver(napi_threadsafe_function fn,const char* status){
 char* value=strdup(status);if(napi_call_threadsafe_function(fn,value,napi_tsfn_nonblocking)!=napi_ok)free(value);napi_release_threadsafe_function(fn,napi_tsfn_release);
}
static void query(UNUserNotificationCenter* center,napi_threadsafe_function fn){
 [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings* settings){
  switch(settings.authorizationStatus){case UNAuthorizationStatusAuthorized:case UNAuthorizationStatusProvisional:deliver(fn,"granted");break;case UNAuthorizationStatusDenied:deliver(fn,"denied");break;case UNAuthorizationStatusNotDetermined:deliver(fn,"not-determined");break;default:deliver(fn,"unknown");}
 }];
}
static napi_value getStatus(napi_env env,napi_callback_info info){
 size_t count=2;napi_value args[2];napi_get_cb_info(env,info,&count,args,nullptr,nullptr);bool request=false;napi_valuetype type;
 if(count!=2||napi_get_value_bool(env,args[0],&request)!=napi_ok||napi_typeof(env,args[1],&type)!=napi_ok||type!=napi_function){napi_throw_type_error(env,nullptr,"Expected request boolean and callback");return nullptr;}
 napi_value name;napi_create_string_utf8(env,"notification-permission",NAPI_AUTO_LENGTH,&name);napi_threadsafe_function fn;
 if(napi_create_threadsafe_function(env,args[1],nullptr,name,0,1,nullptr,nullptr,nullptr,callback,&fn)!=napi_ok)return nullptr;
 napi_unref_threadsafe_function(env,fn);
 if([NSBundle mainBundle].bundleIdentifier.length==0){deliver(fn,"unknown");napi_value result;napi_get_undefined(env,&result);return result;}
 @try{
  UNUserNotificationCenter* center=[UNUserNotificationCenter currentNotificationCenter];
  if(request){[center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings* settings){
   if(settings.authorizationStatus==UNAuthorizationStatusNotDetermined){[center requestAuthorizationWithOptions:UNAuthorizationOptionAlert completionHandler:^(BOOL granted,NSError* error){if(error)deliver(fn,"unknown");else query(center,fn);}];}else query(center,fn);
  }];}else query(center,fn);
 }@catch(NSException* error){deliver(fn,"unknown");}
 napi_value result;napi_get_undefined(env,&result);return result;
}
static napi_value init(napi_env env,napi_value exports){napi_value fn;napi_create_function(env,"getStatus",NAPI_AUTO_LENGTH,getStatus,nullptr,&fn);napi_set_named_property(env,exports,"getStatus",fn);return exports;}
NAPI_MODULE(NODE_GYP_MODULE_NAME,init)
