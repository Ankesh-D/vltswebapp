// Run from the project root: node src/app/features/alert/sos-alert/sos-alert.leaflet.test.cjs
// Uses real Leaflet in headless Chrome with mocked API responses and offline tiles.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const sass = require('sass');
const WS = require('ws');
const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sos-leaflet-test-'));
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true, esModuleInterop: true }
}).outputText;
const component = compile('src/app/features/alert/sos-alert/sos-alert.component.ts');
const basemaps = compile('src/app/shared/components/map-layer-options/map-basemaps.ts');
const globals = sass.compile('src/styles.scss',{loadPaths:['node_modules']}).css.replace(/@import[^;]+;/g,'');
const css = sass.compile('src/app/features/alert/sos-alert/sos-alert.component.scss').css.replaceAll(':host', 'body').replaceAll('::ng-deep', '');
const asset = file => pathToFileURL(path.join(root, 'node_modules', file)).href;
const html = `<!doctype html><html><head><link rel="stylesheet" href="${asset('leaflet/dist/leaflet.css')}"><style>${globals}${css}\n#map1,#singleAlertMap{width:600px;height:400px;position:relative;} body{margin:0;}</style></head><body><div id="map1" class="map-container"></div><div class="single-alert-body" style="width:600px;height:400px"><div class="single-alert-map-shell"><div id="singleAlertMap"></div><div class="single-alert-layers-control"><button class="single-alert-layers-btn">Layers</button></div></div><div class="single-alert-info-panel"><div class="panel-header">Alert Info</div><div class="panel-content">Vehicle details</div></div></div>
<script src="${asset('leaflet/dist/leaflet.js')}"></script><script src="${asset('leaflet.markercluster/dist/leaflet.markercluster.js')}"></script><script src="${asset('@turf/turf/turf.min.js')}"></script><script src="${asset('dayjs/dayjs.min.js')}"></script><script>
const testResults=[];
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
L.TileLayer.prototype.createTile=function(coords,done){const tile=document.createElement('div');setTimeout(()=>done(null,tile),0);return tile;};
const noop=()=>{};
const generic = new Proxy({}, {get:()=>function(){}});
const require=name=>{
 if(name==='leaflet')return L;
 if(name==='leaflet.markercluster')return {};
 if(name==='@turf/turf')return turf;
 if(name==='dayjs')return dayjs;
 if(name.includes('map-basemaps'))return baseExports;
 if(name==='@angular/core')return {Component:()=>target=>target};
 if(name==='@angular/router')return {NavigationStart:class{}};
 if(name==='rxjs/operators')return {filter:()=>noop};
 return generic;
};
const baseExports={};new Function('require','exports',${JSON.stringify(basemaps)})(require,baseExports);
const componentExports={};new Function('require','exports',${JSON.stringify(component)})(require,componentExports);
const alert={param2:'vehicle-id',param25:'22.57',param26:'88.36',param10:'WB01AB1234',param4:'123',param12:'10-Oct-2026',param27:10,param29:'1'};
const subscription=()=>({unsubscribe(){this.closed=true;}});
let liveCallback,stationCallback,historyCallback,emergencyCallback,panicOpen=false,lastVehicleId;
window.$=()=>({modal(value){if(value==='hide')panicOpen=false;else panicOpen=true;return this;},hasClass:()=>panicOpen});
const alertService={
 getLiveEmergencyVehiclesCompliance:()=>({subscribe:observer=>{emergencyCallback=observer;return subscription();}}),
 getPoliceStationDetails:()=>({subscribe:observer=>{stationCallback=observer;return subscription();}})
};
const vehicleService={
 getLiveTrack:id=>({subscribe:observer=>{lastVehicleId=id;liveCallback=observer;return subscription();}}),
 getVehicleHistory:()=>({subscribe:observer=>{historyCallback=observer;return subscription();}})
};
const c=new componentExports.SosAlertComponent(alertService,vehicleService,{detectChanges:noop},{run:callback=>callback()},{show:noop},{});
window.alertComponentInstance=c;c.showPoliceStations=true;
const history=[{param4:22.57,param5:88.36,param9:12,param12:'1'},{param4:22.57001,param5:88.36001,param9:20,param12:'10',param13:'panic'}];
(async()=>{
 c.OpenModelPanic('123');await delay(550);
 emergencyCallback.next({entity:{listData:[alert]}});
 assert(c.map instanceof L.Map&&c.singleAlertMap===c.map,'panic map must use native Leaflet');
 assert(c.emergencyMarker instanceof L.Marker,'SOS marker missing');
 assert(Math.abs(c.emergencyMarker.getLatLng().lat-22.57)<1e-6,'SOS latitude/longitude swapped');
 assert(c.emergencyMarker.getPopup().getContent().includes('WB01AB1234'),'SOS popup details missing');
 stationCallback.next({entity:{listData:[{param9:'22.58',param10:'88.37',param2:'Station'}]}});
 assert(c.policeStationMarkers.length===1,'police station missing');
 for(const id of baseExports.MAP_BASEMAPS.map(style=>style.id))c.changeMapStyle(id);
 assert(c.map.hasLayer(c.emergencyMarker)&&c.map.hasLayer(c.policeStationMarkers[0]),'layers switch removed SOS/police markers');
 assert(c.mainBasemap instanceof L.TileLayer.WMS,'TomTom WMS missing');
 c.showPoliceStations=false;c.togglePoliceStations();assert(!c.policeStationMarkers.length,'police toggle failed');
 testResults.push('SOS marker, popup, coordinates, five basemaps and police-station toggle');
 c.openSingleAlertMapWithData('vehicle-id',88.36,22.57,'WB01AB1234');
 historyCallback.next({status:true,entity:{listData:[...history,{param4:'bad',param5:'bad'}]}});
 assert(c.historyDataList.length===2,'invalid history coordinates were retained');
 assert(c.historyRoute instanceof L.Polyline,'history route missing');
 assert(c.singleAlertHistoryStartMarker.getPopup()&&c.singleAlertHistoryEndMarker.getPopup(),'start/end popups missing');
 assert(c.historyAlertLayers.getLayers().length===1,'history alert icon missing');
 const ignition=c.singleHistoryLayers.getLayers().find(layer=>layer instanceof L.Marker);
 assert(ignition?.getPopup(),'ignition status popup missing');
 ignition.fire('click');assert(c.historyPlaybackIndex===0&&c.poiData.ignition==='On','ignition point click did not update panel');
 c.speedSliderValue=20;c.playHistory();await delay(350);
 assert(!c.isHistoryPlaying&&c.historyPlaybackIndex===2,'history playback did not finish');
 assert(Math.abs(c.singleAlertHistoryMarker.getLatLng().lat-22.57001)<1e-6,'history marker final position incorrect');
 c.restartHistory();c.pauseHistory();assert(!c.historyTimer,'pause did not cancel playback');
 c.stopHistory();assert(c.historyPlaybackIndex===0,'stop did not reset playback');
 c.changeMapStyle('satellite-v9');assert(c.map.hasLayer(c.singleHistoryLayers),'basemap switch removed history');
 testResults.push('history ignition/alert points, route, endpoint popups, playback and layer preservation');
 c.startLiveTrackingFromPopup('vehicle-id',88.36,22.57,'WB01AB1234');
 assert(lastVehicleId==='vehicle-id','live API must receive the selected vehicle ID');
 const response={entity:[{param38:22.571,param39:88.361,param43:90,param40:30,param13:'WB01AB1234'}]};
 liveCallback.next(response);
 assert(c.singleAlertLiveMarker instanceof L.Marker,'live marker missing');
 assert(c.singleAlertLiveMarker.getElement().firstElementChild.style.transform==='rotate(90deg)','vehicle rotation missing');
 assert(c.singleLiveRoute instanceof L.Polyline,'live route missing');
 const stale=liveCallback;c.closeMapModal();stale.next(response);
 assert(!c.map&&!c.singleAlertMap&&!c.singleAlertLiveInterval,'closed panic map recreated tracking');
 c.OpenModelPanic('123');c.closeMapModal();await delay(550);assert(!c.map,'delayed panic map reopened after close');
 testResults.push('live vehicle ID, rotation, trail and panic-modal cleanup');
 c.startLiveTrackingFromPopup('other-id',88.36,22.57,'WB02AB5678');await delay(550);
 assert(c.singleAlertMap instanceof L.Map&&lastVehicleId==='other-id','standalone tracking modal did not initialize');
 liveCallback.next(response);
 c.changeSingleAlertMapStyle('googlehybrid');assert(c.singleAlertMap.hasLayer(c.singleLiveLayers),'standalone basemap removed tracking');
 const panel=document.querySelector('.single-alert-info-panel'),rect=panel.getBoundingClientRect();
 assert(panel.contains(document.elementFromPoint(rect.left+20,rect.top+20)),'bottom-right panel is behind Leaflet');
 c.closeSingleAlertModal();assert(!c.singleAlertMap&&!c.singleAlertLiveInterval,'standalone modal cleanup failed');
 c.startLiveTrackingFromPopup('other-id',88.36,22.57,'WB02AB5678');c.closeSingleAlertModal();await delay(550);
 assert(!c.singleAlertMap,'standalone map reopened after close');
 c.ngOnDestroy();assert(c.mapResizeObservers.size===0,'resize observers leaked');
 testResults.push('standalone modal, independent basemap, panel stacking, cancellation and destroy cleanup');
 window.testResult={status:'PASS',tests:testResults};
})().catch(error=>window.testResult={status:'FAIL',error:error.stack,tests:testResults});
</script></body></html>`;
fs.writeFileSync(path.join(temp,'index.html'),html);
(async()=>{
 const browser=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--allow-file-access-from-files','--remote-debugging-port=0',`--user-data-dir=${path.join(temp,'chrome')}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let socket;
 try{
  const endpoint=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),15000);browser.on('error',reject);browser.stderr.on('data',data=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});});
  const tabs=await(await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  socket=new WS(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>socket.once('open',resolve));
  let id=0;const pending=new Map();
  socket.on('message',raw=>{const data=JSON.parse(raw);const request=pending.get(data.id);if(request){pending.delete(data.id);data.error?request.reject(Error(data.error.message)):request.resolve(data.result);}});
  const command=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
  await command('Emulation.setDeviceMetricsOverride',{width:1366,height:1000,deviceScaleFactor:1,mobile:false});
  await command('Page.navigate',{url:pathToFileURL(path.join(temp,'index.html')).href});
  let result;
  for(let i=0;i<60;i++){await new Promise(resolve=>setTimeout(resolve,250));const output=await command('Runtime.evaluate',{expression:'window.testResult',returnByValue:true});result=output.result.value;if(result)break;}
  if(!result)throw Error('Browser tests timed out');
  console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
 }finally{
  socket?.close();
  if(browser.exitCode===null&&browser.signalCode===null){const stopped=new Promise(resolve=>browser.once('exit',resolve));browser.kill();await stopped;}
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
