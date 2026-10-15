'use strict';
const {createHash}=require('node:crypto');
const {resolve,join,relative,isAbsolute}=require('node:path');
const {existsSync,lstatSync,realpathSync}=require('node:fs');
const identity=require('../../src/shared/storeIdentity.json');
function publisherId(publisher){const alphabet='0123456789abcdefghjkmnpqrstvwxyz';const bits=[...createHash('sha256').update(publisher,'utf16le').digest().subarray(0,8)].map(n=>n.toString(2).padStart(8,'0')).join('')+'0';let result='';for(let i=0;i<65;i+=5)result+=alphabet[parseInt(bits.slice(i,i+5),2)];return result;}
function validateIdentity(value=identity){
 const expected={name:'NocodeMrli.Thoughtline',publisher:'CN=B5946604-C81F-4CBD-97F9-E2F6C22D124D',publisherDisplayName:'NocodeMrli',storeId:'9PK55N0ZM4TB',applicationId:'App',packageFamilyName:'NocodeMrli.Thoughtline_a1n5zxj14c524',toastClsid:'5d3acf61-53d7-51af-ad67-05db67eae9e8'};
 for(const [key,v] of Object.entries(expected))if(value[key]!==v)throw Error(`Unexpected Store identity: ${key}`);
 if(value.packageFamilyName!==`${value.name}_${publisherId(value.publisher)}`)throw Error('Publisher hash mismatch');
 return value;
}
function storeVersion(version){if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))throw Error('Expected stable semver');const [a,b,c]=version.split('.').map(Number);if(a>=65535||b>65535||c>65535)throw Error('Store version overflow');return `${a+1}.${b}.${c}.0`;}
function assertSourceBinding(expected,actual,expectedTree,actualTree){if(!/^[a-f0-9]{40}$/.test(expected)||!/^[a-f0-9]{40}$/.test(expectedTree)||expected!==actual||expectedTree!==actualTree)throw Error('Frozen source mismatch');}
function ownedStage(root,path){const requestedRelative=relative(resolve(root),resolve(path));root=realpathSync(root);const stage=resolve(root,requestedRelative),allowed=join(root,'dist','store','staging');if(stage!==allowed)throw Error('Refusing non-owned package stage');for(let part=join(root,'dist');;){if(existsSync(part)&&(lstatSync(part).isSymbolicLink()||realpathSync(part)!==part))throw Error('Symlink stage rejected');if(part===stage)break;const rest=relative(part,stage);if(rest.startsWith('..')||isAbsolute(rest))throw Error('Stage escape');part=join(part,rest.split(/[\\/]/)[0]);}return stage;}
function manifest(version,value=identity){const i=validateIdentity(value);return `<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10" xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10" xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10" xmlns:com="http://schemas.microsoft.com/appx/manifest/com/windows10" xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities" IgnorableNamespaces="uap desktop com rescap">
 <Identity Name="${i.name}" Publisher="${i.publisher}" Version="${storeVersion(version)}" ProcessorArchitecture="x64"/>
 <Properties><DisplayName>Thoughtline</DisplayName><PublisherDisplayName>${i.publisherDisplayName}</PublisherDisplayName><Description>Desktop thoughts on a vine</Description><Logo>Assets\\StoreLogo.png</Logo></Properties>
 <Resources><Resource Language="en-US"/><Resource Language="zh-CN"/></Resources>
 <Dependencies><TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.19041.0" MaxVersionTested="10.0.26100.0"/></Dependencies>
 <Capabilities><rescap:Capability Name="runFullTrust"/></Capabilities>
 <Applications><Application Id="${i.applicationId}" Executable="app\\Thoughtline.exe" EntryPoint="Windows.FullTrustApplication">
 <uap:VisualElements DisplayName="Thoughtline" Description="Desktop thoughts on a vine" BackgroundColor="transparent" Square150x150Logo="Assets\\Square150x150Logo.png" Square44x44Logo="Assets\\Square44x44Logo.png"/>
 <Extensions>
 <desktop:Extension Category="windows.toastNotificationActivation"><desktop:ToastNotificationActivation ToastActivatorCLSID="${i.toastClsid}"/></desktop:Extension>
 <com:Extension Category="windows.comServer"><com:ComServer><com:ExeServer Executable="app\\Thoughtline.exe" Arguments="-ToastActivated" DisplayName="Thoughtline"><com:Class Id="${i.toastClsid}" DisplayName="Thoughtline toast activator"/></com:ExeServer></com:ComServer></com:Extension>
 </Extensions></Application></Applications>
</Package>\n`;}
module.exports={identity,validateIdentity,publisherId,storeVersion,manifest,ownedStage,assertSourceBinding};
