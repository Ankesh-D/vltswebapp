import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import L from 'leaflet';
import dayjs from 'dayjs';
import { ToastService } from '../../../core/services/toast.service';
import { PanicSessionMapComponent } from './panic-session-map.component';
import { PanicSession, historyPoints, historyRequests, parsePanicTime } from './panic-session.model';

const session: PanicSession = {
  sessionId: '42', vehicleNumber: 'WB01A1234', chassisNumber: 'CHASSIS', imeiNumber: '12345',
  vehicleClass: 'Bus', rto: 'Kolkata', ownerName: 'Owner', ownerPhone: '9876543210',
  lastEventTime: '2026-10-08 10:00:00', lastEventLocation: 'Park Street', latitude: 22.55,
  longitude: 88.35, status: 'Open'
};

describe('Panic history range and normalization', () => {
  it('interprets unzoned timestamps as IST and preserves ISO instants', () => {
    expect(parsePanicTime('2026-10-08 10:00:00')?.toISOString()).toBe('2026-10-08T04:30:00.000Z');
    expect(parsePanicTime('08-Oct-2026 10:00:00 AM')?.toISOString()).toBe('2026-10-08T04:30:00.000Z');
    expect(parsePanicTime('2026-10-08T10:00:00+05:30')?.toISOString()).toBe('2026-10-08T04:30:00.000Z');
    expect(parsePanicTime('invalid')).toBeNull();
  });
  it('requests each Indian calendar day when a session crosses midnight', () => {
    expect(historyRequests('WB01', new Date('2026-10-07T23:50:00+05:30'), new Date('2026-10-09T00:10:00+05:30'))).toEqual([
      { param1: 'WB01', param2: '07-Oct-2026', param3: '11:50 PM', param4: '11:59 PM' },
      { param1: 'WB01', param2: '08-Oct-2026', param3: '12:00 AM', param4: '11:59 PM' },
      { param1: 'WB01', param2: '09-Oct-2026', param3: '12:00 AM', param4: '12:10 AM' }
    ]);
  });
  it('sorts, deduplicates and excludes invalid GPS and out-of-range packets', () => {
    const row = { param3: '2026-10-08 10:01:00', param4: '22.5', param5: '88.3', param6: '12' };
    const points = historyPoints([row, row,
      { Param3: '2026-10-08 10:00:30', Param4: '22.4', Param5: '88.2' },
      { ...row, param4: '', param5: '' }, { ...row, param4: '99' },
      { ...row, param3: '2026-10-08 09:59:59' }, { ...row, param3: '2026-10-08 10:02:01' }
    ], new Date('2026-10-08T10:00:00+05:30'), new Date('2026-10-08T10:02:00+05:30'));
    expect(points.length).toBe(2);
    expect(points[0].time.toISOString()).toBe('2026-10-08T04:30:30.000Z');
    expect(points[1].speed).toBe(12);
  });
});

describe('PanicSessionMapComponent', () => {
  let fixture: ComponentFixture<PanicSessionMapComponent>;
  let component: PanicSessionMapComponent;
  let http: HttpTestingController;
  let toast: jasmine.SpyObj<ToastService>;
  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-10-08T11:00:00+05:30'));
    // Keep the actual Leaflet map/control lifecycle but avoid external tile requests.
    spyOn(L.TileLayer.prototype as unknown as { createTile: () => HTMLElement }, 'createTile').and.callFake(() => document.createElement('img'));
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['show']);
    await TestBed.configureTestingModule({ imports: [PanicSessionMapComponent, HttpClientTestingModule], providers: [{ provide: ToastService, useValue: toast }] }).compileComponents();
    fixture = TestBed.createComponent(PanicSessionMapComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('session', { ...session });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    try { fixture?.destroy(); http?.verify(); }
    finally { jasmine.clock().uninstall(); }
  });
  it('initializes a Leaflet modal, panic asset, details panel and exact history range', () => {
    fixture.detectChanges();
    const request = http.expectOne('/psv_get_vehiclehistory?type=All');
    expect(request.request.body).toEqual({ param1: 'WB01A1234', param2: '08-Oct-2026', param3: '10:00 AM', param4: '11:00 AM' });
    request.flush({ status: true, entity: { listData: [
      { param3: '2026-10-08 10:10:00', param4: '22.56', param5: '88.36', param6: '10' },
      { param3: '2026-10-08 10:20:00', param4: '22.57', param5: '88.37', param6: '15' }
    ] } });
    fixture.detectChanges();
    expect(component.points.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.leaflet-container')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.leaflet-marker-pane img[src="assets/mapimages/alertimage/panic.png"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.info-list').textContent).toContain('9876543210');
    expect(fixture.nativeElement.querySelector('.info-list a').getAttribute('href')).toBe('tel:9876543210');
    expect(fixture.nativeElement.querySelector('.erss-button').disabled).toBeTrue();
    component.seek(1);
    expect(component.currentPoint?.speed).toBe(15);
    component.panelCollapsed = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#panic-map-panel')).toBeNull();
  });
  it('does not query a fabricated history interval when the panic time is invalid', () => {
    fixture.componentRef.setInput('session', { ...session, lastEventTime: 'invalid' });
    fixture.detectChanges();
    http.expectNone('/psv_get_vehiclehistory?type=All');
    expect(component.historyMessage).toContain('invalid');
  });
  it('reports failed history and cancels pending requests when the modal closes', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush('Failed', { status: 500, statusText: 'Error' });
    expect(component.historyMessage).toContain('incomplete');
    component.loadHistory();
    const pending = http.expectOne('/psv_get_vehiclehistory?type=All');
    fixture.destroy();
    expect(pending.cancelled).toBeTrue();
  });
  it('loads both days in a midnight-spanning session without truncating the track', () => {
    fixture.componentRef.setInput('session', { ...session, lastEventTime: '2026-10-07 23:50:00' });
    fixture.detectChanges();
    const first = http.expectOne('/psv_get_vehiclehistory?type=All');
    expect(first.request.body.param2).toBe('07-Oct-2026');
    first.flush({ status: true, entity: { listData: [{ param3: '2026-10-07 23:55:00', param4: '22.5', param5: '88.3' }] } });
    const second = http.expectOne('/psv_get_vehiclehistory?type=All');
    expect(second.request.body.param2).toBe('08-Oct-2026');
    second.flush({ status: true, entity: { listData: [{ param3: '2026-10-08 00:05:00', param4: '22.6', param5: '88.4' }] } });
    expect(component.points.length).toBe(2);
    expect(component.completedDays).toBe(2);
    expect(component.loading).toBeFalse();
  });
  it('offers date/time controls and generates history for the selected range', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [] } });
    component.activeTab = 'history';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#panic-history-date').type).toBe('text');
    expect(fixture.nativeElement.querySelectorAll('timepicker').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.generate-history-button').textContent).toContain('Generate history');
    component.historyDate = { startDate: dayjs('2026-10-07'), endDate: dayjs('2026-10-07') };
    component.fromTime = new Date(2000, 0, 1, 9, 0);
    component.toTime = new Date(2000, 0, 1, 9, 30);
    component.generateHistory();
    const request = http.expectOne('/psv_get_vehiclehistory?type=All');
    expect(request.request.body).toEqual({ param1: 'WB01A1234', param2: '07-Oct-2026', param3: '09:00 AM', param4: '09:30 AM' });
    request.flush({ status: true, entity: { listData: [
      { param3: '2026-10-07 09:15:00', param4: '22.5', param5: '88.3' },
      { param3: '2026-10-07 09:45:00', param4: '22.6', param5: '88.4' }
    ] } });
    expect(component.points.length).toBe(1);
    expect(component.rangeMode).toBe('custom');
    expect(component.rangeStart?.toISOString()).toBe('2026-10-07T03:30:00.000Z');
  });

  it('rejects reversed and future ranges without requesting history', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [] } });
    component.historyDate = { startDate: dayjs('2026-10-08'), endDate: dayjs('2026-10-08') };
    component.fromTime = new Date(2000, 0, 1, 10, 0);
    component.toTime = new Date(2000, 0, 1, 9, 0);
    component.generateHistory();
    expect(component.filterError).toContain('earlier');
    component.toTime = new Date(2000, 0, 1, 12, 0);
    component.generateHistory();
    expect(component.filterError).toContain('before now');
    http.expectNone('/psv_get_vehiclehistory?type=All');
  });

  it('switches base layers without clearing history and toggles police station markers', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [
      { param3: '2026-10-08 10:10:00', param4: '22.56', param5: '88.36' }
    ] } });
    component.changeMapStyle('satellite-v9');
    expect(component.activeMapStyle).toBe('satellite-v9');
    expect(component.points.length).toBe(1);
    component.isLayerSwitcherOpen = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.layer-option').length).toBe(6);
    component.showPoliceStations = true;
    component.togglePoliceStations();
    const stations = http.expectOne('/policestationdetails');
    expect(stations.request.body).toEqual({ param1: '', param2: 1, param3: 20 });
    stations.flush({ status: true, entity: { listData: [{ param2: 'Police station', param7: 'Kolkata', param8: 'West Bengal', param9: '22.55', param10: '88.35' }] } });
    expect(fixture.nativeElement.querySelector('.leaflet-marker-pane img[src="assets/mapimages/police-station.png"]')).not.toBeNull();
    component.showPoliceStations = false;
    component.togglePoliceStations();
    expect(fixture.nativeElement.querySelector('.leaflet-marker-pane img[src="assets/mapimages/police-station.png"]')).toBeNull();
  });

  it('silently starts live tracking for the API No Data Found response with statuscode 504', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 });
    expect(toast.show).not.toHaveBeenCalled();
    expect(component.liveActive).toBeTrue();
    expect(component.historyMessage).toBe('');
    expect(component.loading).toBeFalse();
    expect(component.points.length).toBe(0);
  });

  it('recognizes the same no-data body when the server returns HTTP 504', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 }, { status: 504, statusText: 'Gateway Timeout' });
    expect(toast.show).not.toHaveBeenCalled();
    expect(component.liveActive).toBeTrue();
    expect(component.historyMessage).not.toContain('incomplete');
  });

  it('waits for all history dates before starting live tracking', () => {
    fixture.componentRef.setInput('session', { ...session, lastEventTime: '2026-10-07 23:50:00' });
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 });
    expect(toast.show).not.toHaveBeenCalled();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 });
    expect(toast.show).not.toHaveBeenCalled();
    expect(component.liveActive).toBeTrue();
  });

  it('plots live positions after history and ignores stale or repeated packets', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [
      { param3: '2026-10-08 10:20:00', param4: '22.57', param5: '88.37', param6: '15' }
    ] } });
    jasmine.clock().tick(0);
    const live = http.expectOne('/psv_get_livetrack');
    expect(live.request.body).toEqual({ param5: 'WB01A1234', param6: 'activated' });
    live.flush({ status: true, entity: [{ param35: '2026-10-08 10:59:00', param38: '22.58', param39: '88.38', param40: '25', param9: 'Vendor A' }] });
    expect(component.points.length).toBe(1);
    expect(component.livePoint?.speed).toBe(25);
    expect(component.session.vendorName).toBe('Vendor A');
    expect((component as any).liveTrail.getLatLngs().length).toBe(2);
    jasmine.clock().tick(10000);
    http.expectOne('/psv_get_livetrack').flush({ status: true, entity: [{ param35: '2026-10-08 10:10:00', param38: '22.60', param39: '88.40' }] });
    expect(component.livePoint?.speed).toBe(25);
    expect((component as any).liveTrail.getLatLngs().length).toBe(2);
    jasmine.clock().tick(10000);
    const pending = http.expectOne('/psv_get_livetrack');
    fixture.destroy();
    expect(pending.cancelled).toBeTrue();
  });

  it('starts at the first live position when history is empty and stops live for back-date history', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 });
    jasmine.clock().tick(0);
    http.expectOne('/psv_get_livetrack').flush({ status: true, entity: [{ param35: '2026-10-08 10:59:00', param38: '22.58', param39: '88.38', param40: '0' }] });
    expect((component as any).liveTrail.getLatLngs().length).toBe(1);
    expect(toast.show).not.toHaveBeenCalled();
    component.loadHistory(new Date('2026-10-07T09:00:00+05:30'), new Date('2026-10-07T09:30:00+05:30'));
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: 'No Data Found', statuscode: 504 });
    jasmine.clock().tick(10000);
    http.expectNone('/psv_get_livetrack');
    expect(component.liveActive).toBeFalse();
    expect(component.livePoint).toBeUndefined();
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('keeps compact vehicle and history panels inside the map without inner scrolling', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [] } });
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.info-panel');
    const body = fixture.nativeElement.querySelector('.map-body');
    const content = fixture.nativeElement.querySelector('.panel-scroll');
    expect(getComputedStyle(content).overflowY).toBe('visible');
    expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(body.getBoundingClientRect().top);
    component.activeTab = 'history'; fixture.detectChanges();
    expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(body.getBoundingClientRect().top);
    expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1);
  });

  it('redraws chart results when an already-open map receives another session group', () => {
    fixture.detectChanges();
    http.expectOne('/psv_get_vehiclehistory?type=All').flush({ status: true, entity: { listData: [] } });
    const next = { ...session, sessionId: 'next', vehicleNumber: 'WB222', latitude: 23, longitude: 88 };
    const other = { ...session, sessionId: 'other', vehicleNumber: 'WB333', latitude: 24, longitude: 89 };
    fixture.componentRef.setInput('session', next);
    fixture.componentRef.setInput('sessions', [next, other]);
    fixture.detectChanges();
    const request = http.expectOne('/psv_get_vehiclehistory?type=All');
    expect(request.request.body.param1).toBe('WB222');
    request.flush({ status: true, entity: { listData: [] } });
    expect((component as any).sessionLayer.getLayers().length).toBe(2);
    const positions = (component as any).sessionLayer.getLayers().map((marker: L.Marker) => [marker.getLatLng().lat, marker.getLatLng().lng]);
    expect(positions).toEqual([[23, 88], [24, 89]]);
    fixture.componentRef.setInput('sessions', [next]); fixture.detectChanges();
    expect((component as any).sessionLayer.getLayers().length).toBe(1);
  });

});
