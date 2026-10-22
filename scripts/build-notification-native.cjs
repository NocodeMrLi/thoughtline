// SPDX-License-Identifier: GPL-3.0-only
const {spawnSync}=require('node:child_process'),{mkdirSync}=require('node:fs'),{resolve}=require('node:path');
if(process.platform==='darwin'){
 const directory=resolve(process.env.THOUGHTLINE_BUILD_DIR||'out','main');mkdirSync(directory,{recursive:true});
 const r=spawnSync('/usr/bin/clang++',['-shared','-undefined','dynamic_lookup','-fobjc-arc','-fblocks','-mmacosx-version-min=11.0','-DNAPI_VERSION=8','-DNODE_GYP_MODULE_NAME=notification_permission','-I',require('node-api-headers').include_dir,'-framework','Foundation','-framework','UserNotifications','src/main/native/notificationPermission.mm','-o',resolve(directory,'notification-permission.node')],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);
}
