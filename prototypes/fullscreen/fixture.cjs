const {app,BrowserWindow,screen}=require('electron');
app.setName('Thoughtline G7 isolated target');
app.whenReady().then(()=>{
 const b=screen.getPrimaryDisplay().workArea;
 const win=new BrowserWindow({x:b.x+Math.round((b.width-640)/2),y:b.y+Math.round((b.height-420)/2),width:640,height:420,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false}});
 win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<body style="background:#dde7f2;font:24px sans-serif;padding:40px">G7 isolated fullscreen test target<br>Only synthetic fixture data</body>'));
 win.once('ready-to-show',()=>{win.show();win.focus();});
});
app.on('window-all-closed',()=>app.quit());
