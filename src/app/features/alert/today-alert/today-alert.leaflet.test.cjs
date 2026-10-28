// Run from the project root: node src/app/features/alert/today-alert/today-alert.leaflet.test.cjs
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'today-leaflet-test-'));
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true, esModuleInterop: true }
}).outputText;
const component = compile('src/app/features/alert/today-alert/today-alert.component.ts');
const basemaps = compile('src/app/shared/components/map-layer-options/map-basemaps.ts');
const css = sass.compile('src/app/features/alert/today-alert/today-alert.component.scss').css.replaceAll(':host', 'body').replaceAll('::ng-deep', '');
const asset = file => pathToFileURL(path.join(root, 'node_modules', file)).href;
const html = `<!doctype html><html><head><link rel="stylesheet" href="${asset('leaflet/dist/leaflet.css')}"><style>${css}\n#map,#singleAlertMap{width:600px;height:400px;position:relative;} body{margin:0;}</style></head><body><div id="map"></div><div class="single-alert-body" style="width:600px;height:400px"><div class="single-alert-map-shell"><div id="singleAlertMap"></div><div class="single-alert-layers-control"><button class="single-alert-layers-btn">Layers</button></div></div><div class="single-alert-info-panel"><div class="panel-header">Alert Info</div><div class="panel-content">Vehicle details</div></div></div>
<script src="${asset('leaflet/dist/leaflet.js')}"></script><script src="${asset('leaflet.markercluster/dist/leaflet.markercluster.js')}"></script><script src="${asset('@turf/turf/turf.min.js')}"></script><script>
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
 if(name.includes('map-basemaps'))return baseExports;
 if(name==='@angular/core')return {Component:()=>target=>target};
 if(name==='@angular/router')return {NavigationStart:class{}};
 if(name==='rxjs/operators')return {filter:()=>noop};
 return generic;
};
const baseExports={};new Function('require','exports',${JSON.stringify(basemaps)})(require,baseExports);
const componentExports={};new Function('require','exports',${JSON.stringify(component)})(require,componentExports);
const alert={param2:'10',param6:'22.57',param7:'88.36',param9:'WB01AB1234',param8:'Panic',param20:'1',param4:'123',param21:'10'};
const subscription=()=>({unsubscribe(){this.closed=true;}});
let liveCallback,stationCallback;
const alertService={
 getAlertDetailVehicles:()=>({subscribe:observer=>{observer.next({status:true,entity:{listData:[alert],param1:1}});return subscription();}}),
 getPoliceStationDetails:()=>({subscribe:observer=>{stationCallback=observer;return subscription();}})
};
const vehicleService={getLiveTrack:()=>({subscribe:observer=>{liveCallback=observer;return subscription();}})};
const events={pipe:()=>({subscribe:()=>subscription()})};
const c=new componentExports.TodayAlertComponent(alertService,vehicleService,{detectChanges:noop},{},{events},{},{},{show:noop});
window.alertComponentInstance=c;c.viewMode='map';c.formattedDate='10-Oct-2026';c.selectedAlertType={param1:'10'};
(async()=>{
 c.initializeMap();
 assert(c.map instanceof L.Map,'main map must be Leaflet');
 assert(c.alertClusters.getLayers().length===1,'alert marker missing');
 const marker=c.alertClusters.getLayers()[0];
 assert(Math.abs(marker.getLatLng().lat-22.57)<1e-6,'alert latitude/longitude swapped');
 assert(marker.getPopup().getContent().includes('WB01AB1234'),'alert popup details missing');
 marker.fire('click');assert(c.poiData.vehicleno==='WB01AB1234','marker click must select vehicle');
 c.plotAlertsOnMap([alert,{...alert,param27:JSON.stringify({geometry:{coordinates:[22.57,88.36]}})},{...alert,param6:'bad',param7:'bad'}]);
 assert(c.alertClusters.getLayers().length===2,'geometry fallback/invalid coordinate filtering failed');
 stationCallback.next({entity:{listData:[{param9:'22.58',param10:'88.37',param2:'Station'}]}});
 assert(c.policeStationMarkers.length===1,'police station marker missing');
 const alerts=c.alertClusters;
 for(const id of baseExports.MAP_BASEMAPS.map(style=>style.id))c.changeMapStyle(id);
 assert(c.map.hasLayer(alerts)&&c.map.hasLayer(c.policeStationMarkers[0]),'basemap change removed overlays');
 assert(c.mainBasemap instanceof L.TileLayer.WMS,'TomTom WMS layer missing');
 testResults.push('alerts, clustering, coordinates, popup and five basemap choices');
 c.showSingleAlertModal=true;c.singleAlertModalMode='history';c.initializeSingleAlertMap(alert);
 assert(c.singleAlertMap instanceof L.Map,'modal map must be Leaflet');
 const panel=document.querySelector('.single-alert-info-panel');
 const assertPanelOnTop=()=>{
   const rect=panel.getBoundingClientRect();
   assert(panel.contains(document.elementFromPoint(rect.left+20,rect.top+20)),'bottom-right panel is hidden behind Leaflet');
 };
 assertPanelOnTop();
 const layers=document.querySelector('.single-alert-layers-btn');
 const layersRect=layers.getBoundingClientRect();
 assert(layers.contains(document.elementFromPoint(layersRect.left+5,layersRect.top+5)),'layers control is hidden behind Leaflet');
 stationCallback.next({entity:{listData:[{param9:'22.58',param10:'88.37',param2:'Station'}]}});
 assert(c.policeStationMarkers.length===2,'police markers must work on both maps');
 c.showPoliceStations=false;c.togglePoliceStations();assert(c.policeStationMarkers.length===0,'police toggle must remove markers');
 c.historyDataList=[{param4:22.57,param5:88.36,param6:12},{param4:22.57001,param5:88.36001,param6:20}];
 c.displayHistory({},'WB01AB1234');
 assert(c.singleHistoryLayers.getLayers().some(layer=>layer instanceof L.Polyline),'history route missing');
 assert(c.singleAlertHistoryStartMarker.getPopup(),'start popup missing');
 assert(c.singleAlertHistoryEndMarker.getPopup(),'end popup missing');
 c.changeSingleAlertMapStyle('satellite-v9');
 assert(c.singleAlertMap.hasLayer(c.singleHistoryLayers)&&c.currentStyle==='tomtom','modal basemap changed main map or removed history');
 c.speedSliderValue=10;c.playHistory();await delay(180);
 assert(c.historyPlaybackIndex===1&&!c.isHistoryPlaying,'history playback did not finish');
 assert(Math.abs(c.singleAlertHistoryMarker.getLatLng().lat-22.57001)<1e-6,'history vehicle final position incorrect');
 c.restartHistory();c.pauseHistory();assert(!c.isHistoryPlaying&&!c.singleAlertHistoryAnimationFrameId,'pause did not cancel animation');
 c.stopHistory();assert(c.historyPlaybackIndex===0&&!c.singleAlertHistoryMarker,'stop did not reset playback');
 testResults.push('modal layers, history route, endpoint popups, playback, pause and stop');
 c.clearSingleAlertHistoryLayers();c.singleAlertModalMode='live';c.startSingleAlertLiveTracking('WB01AB1234',[88.36,22.57]);
 const response={entity:[{param38:22.571,param39:88.361,param43:90,param40:30,param13:'WB01AB1234'}]};
 liveCallback.next(response);
 assert(c.singleAlertLiveMarker instanceof L.Marker,'live vehicle missing');
 assert(c.singleAlertLiveMarker.getElement().firstElementChild.style.transform==='rotate(90deg)','vehicle rotation missing');
 c.drawSingleAlertLiveTrail([[88.36,22.57],[88.361,22.571]]);
 assert(c.singleLiveRoute instanceof L.Polyline,'live trail missing');
 assertPanelOnTop();
 testResults.push('bottom-right panel and layers control remain above Leaflet after map and live updates');
 const stale=liveCallback;
 c.closeSingleAlertModal();stale.next(response);
 assert(!c.singleAlertMap&&!c.singleAlertLiveMarker&&!c.singleAlertLiveInterval,'closed modal recreated live tracking');
 c.openSingleAlertMapWithMode(alert,'live');c.closeSingleAlertModal();await delay(700);
 assert(!c.singleAlertMap,'delayed modal initialization ran after close');
 testResults.push('live marker, rotation, trail and cancellation after closing modal');
 c.setViewMode('grid');assert(!c.map,'main map retained after switching to grid');
 c.setViewMode('map');await delay(250);assert(c.map instanceof L.Map,'map did not reopen');
 c.ngOnDestroy();assert(!c.map&&!c.singleAlertMap&&c.mapResizeObservers.size===0,'map cleanup failed');
 testResults.push('map/grid switching, reopening and destroy cleanup');
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
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
