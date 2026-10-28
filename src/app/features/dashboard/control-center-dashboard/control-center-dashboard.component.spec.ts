import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { PanicActionComponent } from '../panic-action/panic-action.component';
import { ToastService } from '../../../core/services/toast.service';
import { ControlCenterDashboardComponent } from './control-center-dashboard.component';

describe('ControlCenterDashboardComponent API integration', () => {
  let fixture: ComponentFixture<ControlCenterDashboardComponent>;
  let component: ControlCenterDashboardComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlCenterDashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(ControlCenterDashboardComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function respond(summary: any, classes: any[] = [], rtos: any[] = []): void {
    const countRequest = http.expectOne('/panicdashcount');
    expect(countRequest.request.method).toBe('POST');
    expect(countRequest.request.body).toEqual({ pagename: 'ControlCenterDashboard' });
    countRequest.flush({ status: true, statuscode: 200, entity: summary });
    const classRequest = http.expectOne('/vehicleclasswisepaniccounts');
    expect(classRequest.request.body).toEqual({ pagename: '' });
    classRequest.flush({ status: true, entity: { listData: classes } });
    const rtoRequest = http.expectOne('/rtowisepaniccounts');
    expect(rtoRequest.request.body).toEqual({ pagename: '' });
    rtoRequest.flush({ status: true, entity: { listData: rtos } });
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { listData: [], param1: '0' } });
    fixture.detectChanges();
  }

  it('consumes all six summary fields and independent chart counts', () => {
    fixture.detectChanges();
    respond({ Param1: '30', Param2: '12', Param3: '8', Param4: '4', Param5: '10', Param6: '6' },
      [{ Param1: 'Bus', Param2: '3' }, { param1: 'Cab', param2: '1' }],
      [{ Param1: 'Kolkata', Param2: '9' }]);
    expect([component.totalSessions, component.openSessions, component.autoClosedSessions,
      component.tamperedSessions, component.operatorClosedSessions, component.pushedToErssSessions]).toEqual([30, 12, 8, 4, 10, 6]);
    expect(component.classTotal).toBe(4);
    expect(component.rtoTotal).toBe(9);
    expect(component.vehicleClassCounts[0].share).toBe(75);
    expect(component.vehicleClassCounts[1].offset).toBe(75);
    expect(component.loading).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.class-column').length).toBe(2);
    expect(component.sessions).toEqual([]);
  });

  it('preserves real zero counts and avoids invalid chart geometry for zero totals', () => {
    fixture.detectChanges();
    respond({ listData: [{ param1: '0', param2: '0', param3: '0', param4: '0', param5: '0', param6: '0' }] },
      [{ Param1: 'Bus', Param2: '0' }]);
    expect(component.totalSessions).toBe(0);
    expect(component.vehicleClassCounts[0].share).toBe(0);
    expect(fixture.nativeElement.querySelector('.class-column-chart')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.class-column-chart').textContent).toContain('Bus');
  });

  it('rejects invalid values rather than displaying invented zero counts', () => {
    fixture.detectChanges();
    respond({ Param1: 'invalid', Param2: '', Param3: '-1', Param4: null },
      [{ Param1: 'Bus', Param2: 'invalid' }, { Param1: 'Cab', Param2: '2' }]);
    expect(component.totalSessions).toBeNull();
    expect(component.openSessions).toBeNull();
    expect(component.autoClosedSessions).toBeNull();
    expect(component.vehicleClassCounts.map(item => item.label)).toEqual(['Cab']);
  });

  it('keeps successful graphs available when summary API fails', () => {
    fixture.detectChanges();
    http.expectOne('/panicdashcount').flush('Failed', { status: 500, statusText: 'Error' });
    http.expectOne('/vehicleclasswisepaniccounts').flush({ status: true, entity: [{ Param1: 'Bus', Param2: '5' }] });
    http.expectOne('/rtowisepaniccounts').flush({ status: false, entity: [] });
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.countsError).toContain('Could not load');
    expect(component.classTotal).toBe(5);
    expect(component.rtoError).toContain('unavailable');
    expect(component.loading).toBeFalse();
  });

  it('prevents duplicate refresh requests while requests are in flight', () => {
    fixture.detectChanges();
    component.refresh();
    respond({ Param1: '1' });
    expect(component.loading).toBeFalse();
  });
  it('maps all session fields and opens the selected session rather than an external map', () => {
    component.loadSessions();
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body).toEqual({ param1: '', param2: '1', param3: '20', param4: '', param5: '', param6: '', pagename: 'ControlCenterDashboard' });
    request.flush({ status: true, entity: { param1: '35', listData: [{
      Param2: 'session-42', Param3: 'WB01A1234', Param4: 'CHASSIS', Param5: '123456789012345',
      Param6: 'Bus', Param7: 'Kolkata', Param8: 'Owner', Param9: '9876543210',
      Param10: '2026-10-08 10:00:00', Param11: 'Park Street', Param12: '22.55', Param13: '88.35'
    }] } });
    expect(component.sessions[0]).toEqual({ sessionId: 'session-42', vehicleNumber: 'WB01A1234',
      chassisNumber: 'CHASSIS', imeiNumber: '123456789012345', vehicleClass: 'Bus', rto: 'Kolkata',
      ownerName: 'Owner', ownerPhone: '9876543210', lastEventTime: '2026-10-08 10:00:00',
      lastEventLocation: 'Park Street', latitude: 22.55, longitude: 88.35, status: 'Open' });
    expect(component.sessionTotal).toBe(35);
    expect(component.hasNextPage).toBeTrue();
    expect(component.sessionsLoading).toBeFalse();
  });

  it('loads sessions using the RTO dropdown ID even after a zero-count class selection', () => {
    component.rtoList = [{ param1: 'rto-19', param2: 'Alipore - WB-19' }];
    component.filterClass = 'Bus';
    component.selectedSeriesCount = 0;
    component.currentPage = 3;
    component.onRtoChange('rto-19');
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body.param6).toBe('rto-19');
    expect(request.request.body.param2).toBe('1');
    expect(component.filterClass).toBe('');
    request.flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.sessionsLoading).toBeFalse();
    expect(component.sessionsError).toBe('');
    component.onRtoChange('');
    const allRtos = http.expectOne('/openpanicsessiondetails');
    expect(allRtos.request.body.param6).toBe('');
    allRtos.flush({ status: true, entity: { listData: [], param1: '0' } });
  });

  it('navigates to the clicked widget in the same tab with its count', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    const open = spyOn(window, 'open');
    component.openSessionWorklist('Open panic sessions', 418);
    expect(navigate).toHaveBeenCalledWith(['/ControlCenterDashboard/sessions'], {
      queryParams: { widget: 'Open panic sessions', count: 418 }
    });
    expect(open).not.toHaveBeenCalled();
  });

  it('paginates the widget records and sends search text in param1', () => {
    Object.defineProperty(component, 'sessionWidget', { value: 'Open panic sessions' });
    Object.defineProperty(component, 'widgetCount', { value: 418 });
    component.loadSessions();
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body.param1).toBe('Open panic sessions');
    expect(request.request.body.param3).toBe('20');
    request.flush({ status: true, entity: { listData: Array.from({ length: 20 }, (_, i) => ({ param2: String(i) })), param1: '999' } });
    expect(component.sessionTotal).toBe(418);
    expect(component.sessions.length).toBe(20);
    expect(component.sessionPageCount).toBe(21);
    expect(component.hasNextPage).toBeTrue();
    component.changePage(1);
    const nextPage = http.expectOne('/openpanicsessiondetails');
    expect(nextPage.request.body.param1).toBe('Open panic sessions');
    expect(nextPage.request.body.param2).toBe('2');
    expect(nextPage.request.body.param3).toBe('20');
    nextPage.flush({ status: true, entity: { listData: [] } });
    expect(component.sessionTotal).toBe(418);
    component.currentPage = 21;
    component.loadSessions();
    const lastPage = http.expectOne('/openpanicsessiondetails');
    lastPage.flush({ status: true, entity: { listData: Array.from({ length: 20 }, (_, i) => ({ param2: String(i) })), param1: '999' } });
    expect(component.sessions.length).toBe(18);
    expect(component.sessionRangeEnd).toBe(418);
    expect(component.hasNextPage).toBeFalse();
    component.searchTerm = ' WB01 ';
    component.searchSessions();
    const search = http.expectOne('/openpanicsessiondetails');
    expect(search.request.body.param1).toBe('WB01');
    expect(search.request.body.param4).toBe('');
    search.flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.sessionTotal).toBe(0);
  });

  it('shows an empty worklist without requesting records for a zero-count widget', () => {
    Object.defineProperty(component, 'sessionWidget', { value: 'Auto closed panic' });
    Object.defineProperty(component, 'widgetCount', { value: 0 });
    component.currentPage = 3;
    component.loadSessions();
    http.expectNone('/openpanicsessiondetails');
    expect(component.sessions).toEqual([]);
    expect(component.sessionTotal).toBe(0);
    expect(component.currentPage).toBe(1);
    expect(component.hasNextPage).toBeFalse();
    expect(component.sessionsLoading).toBeFalse();
  });

  it('sends search and pagination to the server and resets search to page one', () => {
    component.currentPage = 3;
    component.searchTerm = '  WB01  ';
    component.searchSessions();
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body.param1).toBe('WB01');
    expect(request.request.body.param2).toBe('1');
    request.flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.hasNextPage).toBeFalse();
    component.changePage(-1);
    http.expectNone('/openpanicsessiondetails');
  });

  it('cancels older searches so stale results cannot overwrite the latest search', () => {
    component.loadSessions();
    const previous = http.expectOne('/openpanicsessiondetails');
    component.searchTerm = 'new search';
    component.searchSessions();
    expect(previous.cancelled).toBeTrue();
    const latest = http.expectOne('/openpanicsessiondetails');
    latest.flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.sessionsLoading).toBeFalse();
  });

  it('shows a session API error instead of a misleading empty result', () => {
    component.loadSessions();
    http.expectOne('/openpanicsessiondetails').flush('Failed', { status: 500, statusText: 'Error' });
    expect(component.sessionsError).toContain('Could not load');
    expect(component.sessionsLoading).toBeFalse();
  });

  it('renders both charts when the backend sends lowercase listdata', () => {
    fixture.detectChanges();
    http.expectOne('/panicdashcount').flush({ status: true, entity: { param1: '30' } });
    http.expectOne('/vehicleclasswisepaniccounts').flush({ status: true, entity: { listdata: [
      { param1: 'Bus', param2: '12' }, { Param1: 'Cab', Param2: '6' }
    ] } });
    http.expectOne('/rtowisepaniccounts').flush({ status: true, entity: { listdata: [
      { PARAM1: 'Kolkata', PARAM2: '18' }
    ] } });
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { listData: [] } });
    fixture.detectChanges();
    expect(component.classTotal).toBe(18);
    expect(component.rtoTotal).toBe(18);
    expect(component.classError).toBe('');
    expect(component.rtoError).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.class-column').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.rto-column title').textContent).toContain('Kolkata');
    expect(fixture.nativeElement.querySelector('.column-count').textContent).toContain('18');
  });

  it('reports an unreadable nonempty response instead of falsely showing no counts', () => {
    fixture.detectChanges();
    http.expectOne('/panicdashcount').flush({ status: true, entity: { param1: '30' } });
    http.expectOne('/vehicleclasswisepaniccounts').flush({ status: true, entity: { unknownRows: [{ param1: 'Bus', param2: '12' }] } });
    http.expectOne('/rtowisepaniccounts').flush({ status: true, entity: { listdata: [{ param1: 'Kolkata', unknownCount: '18' }] } });
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { listData: [] } });
    fixture.detectChanges();
    expect(component.classError).toContain('could not be read');
    expect(component.rtoError).toContain('could not be read');
    expect(fixture.nativeElement.querySelector('.class-panel').textContent).not.toContain('No vehicle class');
    expect(fixture.nativeElement.querySelector('.class-panel .chart-badge').textContent).toContain('Unavailable');
  });

  it('renders the actual entity.details responses from both panic count APIs', () => {
    fixture.detectChanges();
    http.expectOne('/panicdashcount').flush({ status: true, entity: { param1: '1885' } });
    http.expectOne('/vehicleclasswisepaniccounts').flush({ status: true, entity: { details: [
      { param1: 'Ambulance', param2: '40' },
      { param1: 'Articulated Vehicle', param2: '42' },
      { param1: 'Bus', param2: '214' },
      { param1: 'Dumper', param2: '7' },
      { param1: 'Dumper/Tipper', param2: '2' },
      { param1: 'Educational Institution Bus', param2: '8' },
      { param1: 'Goods Carrier', param2: '794' },
      { param1: 'Luxury Cab', param2: '66' },
      { param1: 'Maxi Cab', param2: '33' },
      { param1: 'Motor Cab', param2: '204' },
      { param1: 'Motor Car', param2: '17' },
      { param1: 'Omni Bus', param2: '66' },
      { param1: 'Private Service Vehicle', param2: '392' }
    ] } });
    http.expectOne('/rtowisepaniccounts').flush({ status: true, entity: { details: [
      { param1: 'Alipore - WB-19', param2: '111' },
      { param1: 'Alipurduar - WB-69', param2: '3' },
      { param1: 'Asansol - WB-37', param2: '86' }
    ] } });
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { listData: [] } });
    fixture.detectChanges();
    expect(component.classTotal).toBe(1885);
    expect(fixture.nativeElement.querySelector('.class-name').textContent).toContain('Goods Carrier');
    expect(fixture.nativeElement.querySelector('.class-count').textContent).toContain('794');
    expect(fixture.nativeElement.querySelector('.column-fill').style.height).toBe('100%');
    expect(component.rtoTotal).toBe(200);
    expect(component.vehicleClassCounts.length).toBe(13);
    expect(component.classError).toBe('');
    expect(component.rtoError).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.class-column').length).toBe(13);
    expect(fixture.nativeElement.querySelectorAll('.rto-column').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.class-panel .chart-badge').textContent).toContain('13 classes');
    expect(fixture.nativeElement.querySelector('.rto-panel .chart-badge').textContent).toContain('200 sessions');
    expect(fixture.nativeElement.querySelector('.rto-column title').textContent).toContain('Alipore - WB-19');
  });

  it('sends the series ID and count in one page-one request, binds immediately, and opens the map only on its button', () => {
    fixture.detectChanges();
    respond({ Param1: '214' }, [{ param1: 'Bus', param2: '214' }]);
    component.selectChart('class', 'Bus');
    const roster = http.expectOne('/psv_get_vehicleclass_roster');
    roster.flush({ status: true, entity: [{ param1: 'class-42', param2: 'Bus' }] });
    const details = http.expectOne('/openpanicsessiondetails');
    expect(details.request.body).toEqual({ param1: '', param2: '1', param3: '214', param4: '', param5: '', param6: 'class-42', pagename: 'ControlCenterDashboard' });
    details.flush({ status: true, entity: { totalCount: 214, details: Array.from({ length: 214 }, (_, index) => ({ param2: 'session-' + index, param3: 'WB' + index, param6: 'Bus', param12: '22.55', param13: '88.35' })) } });
    expect(component.sessions.length).toBe(214);
    expect(component.sessionsLoading).toBeFalse();
    expect(component.selectedSession).toBeNull();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(214);
    expect(fixture.nativeElement.querySelector('app-panic-session-map')).toBeNull();
    http.expectNone('/openpanicsessiondetails');
    component.plotMatching();
    expect(component.plottedSessions.length).toBe(214);
    expect(component.selectedSession?.sessionId).toBe('session-0');
    component.openMap(component.sessions[213]);
    expect(component.plottedSessions.length).toBe(214);
    expect(component.selectedSession?.sessionId).toBe('session-213');
  });

  it('does not automatically load page two after a full details response', () => {
    component.loadSessions();
    http.expectOne('/openpanicsessiondetails').flush({ status: true, entity: { totalCount: 45, listData: Array.from({ length: 20 }, (_, index) => ({ param2: String(index), param3: 'WB' + index })) } });
    expect(component.sessions.length).toBe(20);
    http.expectNone('/openpanicsessiondetails');
    expect(component.currentPage).toBe(1);
    component.changePage(1);
    const next = http.expectOne('/openpanicsessiondetails');
    expect(next.request.body.param2).toBe('2');
    next.flush({ status: true, entity: { totalCount: 45, listData: [] } });
  });

  it('shows all RTO columns in expanded view without a chart scrollbar at a small monitor size', () => {
    fixture.detectChanges();
    respond({ Param1: '47' }, Array.from({ length: 17 }, (_, index) => ({ param1: 'Private Service Vehicle ' + index, param2: '20' })), Array.from({ length: 47 }, (_, index) => ({ param1: 'Kolkata region - WB-' + index, param2: '10' })));
    component.resizeCharts();
    component.expandedChart = 'rto'; fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.rto-panel');
    const bars = panel.querySelector('app-rto-column-chart');
    expect(bars.querySelectorAll('.rto-column').length).toBe(47);
    expect(getComputedStyle(bars).overflowY).toBe('visible');
    expect(bars.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.getBoundingClientRect().bottom + 1);
    expect(bars.scrollWidth).toBeLessThanOrEqual(bars.clientWidth + 1);
    component.expandedChart = 'class'; fixture.detectChanges();
    const classPanel = fixture.nativeElement.querySelector('.class-panel');
    expect(classPanel.querySelectorAll('.class-column').length).toBe(17);
    expect(classPanel.querySelector('.class-chart-footer').getBoundingClientRect().bottom).toBeLessThanOrEqual(classPanel.getBoundingClientRect().bottom + 1);
  });

  it('shows a detailed RTO column tooltip and preserves click drill-down', () => {
    fixture.detectChanges();
    respond({ Param1: '8' }, [], [{ param1: 'Alipore - WB-19', param2: '6', rtoid: 'rto-19' }, { param1: 'Asansol - WB-37', param2: '2' }]);
    const bubble = fixture.nativeElement.querySelector('.rto-column');
    bubble.dispatchEvent(new Event('mouseenter')); fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('.column-tooltip');
    expect(tooltip.textContent).toContain('Alipore - WB-19');
    expect(tooltip.textContent).toContain('6');
    expect(tooltip.textContent).toContain('75%');
    expect(fixture.nativeElement.querySelectorAll('.column-count').length).toBe(2);
    bubble.dispatchEvent(new MouseEvent('click'));
    expect(component.filterRto).toBe('Alipore - WB-19');
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body.param6).toBe('rto-19');
    request.flush({ status: true, entity: { listData: [], param1: '0' } });
    expect(component.sessionsError).toBe('');
    expect(component.sessionsLoading).toBeFalse();
  });

  it('clears stale filters and uses the chart ID directly when supplied by the count response', () => {
    fixture.detectChanges();
    respond({ Param1: '3' }, [{ param1: 'Goods Carrier', param2: '3', vehicleclassid: 'goods-id' }]);
    component.filterRto = 'Old RTO'; component.filterVendor = 'Other vendor'; component.searchTerm = 'old vehicle';
    component.selectChart('class', 'Goods Carrier');
    const request = http.expectOne('/openpanicsessiondetails');
    expect(request.request.body).toEqual({ param1: '', param2: '1', param3: '3', param4: '', param5: '', param6: 'goods-id', pagename: 'ControlCenterDashboard' });
    request.flush({ status: true, entity: { totalCount: 3, details: [{ param2: 'new', param3: 'WB444', param6: 'Goods Carrier' }] } });
    expect(component.filterRto).toBe(''); expect(component.filterVendor).toBe('');
    expect(component.sessions[0].sessionId).toBe('new');
    expect(component.selectedSession).toBeNull();
    http.expectNone('/psv_get_vehicleclass_roster');
  });

});


describe('Panic closure form', () => {
  it('requires a nonblank Panic Close Comment and identifies the contacted owner number', async () => {
    await TestBed.configureTestingModule({ imports: [PanicActionComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PanicActionComponent);
    fixture.componentRef.setInput('session', { sessionId: 'PRIVATE-ID', vehicleNumber: 'WB01A1234', chassisNumber: 'CHASSIS', imeiNumber: '12345', vehicleClass: 'Bus', rto: 'Kolkata', ownerName: 'Owner', ownerPhone: '9876543210', lastEventTime: '2026-10-08 10:00:00', lastEventLocation: 'Park Street', latitude: 22.55, longitude: 88.35, status: 'Open' });
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const component = fixture.componentInstance;
    const root = fixture.nativeElement;
    expect(component.mobileNumber).toBe('9876543210');
    expect(root.textContent).toContain('Owner / contacted mobile number');
    expect(root.textContent).toContain('Panic Close Comment.');
    expect(root.textContent).not.toContain('PRIVATE-ID');
    expect(root.querySelector('textarea').required).toBeTrue();
    component.reason = 'False panic'; component.remark = '   ';
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(root.querySelector('button[type="submit"]').disabled).toBeTrue();
    component.remark = 'Called owner.\nConfirmed false panic.';
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(root.querySelector('button[type="submit"]').disabled).toBeFalse();
    const dialog = root.querySelector('.action-dialog').getBoundingClientRect();
    expect(dialog.width).toBeGreaterThan(600);
    expect(dialog.top).toBeGreaterThanOrEqual(0);
    expect(dialog.bottom).toBeLessThanOrEqual(window.innerHeight);
    const dialogElement = root.querySelector('.action-dialog');
    expect(dialogElement.scrollHeight).toBeLessThanOrEqual(dialogElement.clientHeight + 1);
    const toast = spyOn(TestBed.inject(ToastService), 'show');
    component.submit();
    expect(toast).toHaveBeenCalledWith(jasmine.stringMatching('could not be saved'), 'error');
    fixture.destroy();
  });
});
