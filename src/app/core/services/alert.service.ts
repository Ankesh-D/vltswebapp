import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';
import { AlertGraphViewReq, GeofenceInOutReportReq, OverspeedReportReq, RouteDeviationReportReq, VehicleClassWiseAlertCountReq, VendorwiseInactiveAssetsCountReq } from '../model/request.model';
import { OverspeedReportResponse } from './report.service';
export { ApiResponse };
export interface CurrentDayAlertCount {
  param2: string; // alert id
  param3: string; // alert name
  param4: string; // count
}
export interface CurrentDayAlertItem {
  param1: string;
  param2: string;
  param3: string;
  param4: string;
  param5: string;
}

export interface CurrentDayAlertCountResponse {
  listData: CurrentDayAlertItem[];
}


export interface CurrentDayAlertDetailsResponse {
  listData: any[];
}

export interface Alert {
  param1: string;      // rowNumber
  param4: string;      // Alert Type
  param5: string;      // Event Time
  param11: string;     // Vehicle/Chassis No
  param12: string;     // Vendor Name
  param18: string;     // RTO Name
  param28: string;     // Customer Name
  param29: string;     // Customer Mobile
  [key: string]: any;  // Additional properties
}

export interface AlertListResponse {
  listData: Alert[];
  param1: number; // totalCount
}

export interface AlertRequest {
  param1?: string;  // Search text
  param2?: string;  // Page number (1-based)
  param3?: string;  // Page size
  param4?: string;  // Alert type filter
  param5?: string;  // Date filter
}

export interface LiveEmergencyVehiclesRequest {
  param1: string;//searchby
  param2: string;//searchtype -- DownVehicle, LiveEmergencyVehicles,NotConnected,LiveVehicles,   Connected,NeverConnected,GetStatus
  param3: string;//values
  param4: string;
  param5: string;
  param6: string;//state
  param7: string;//discrict
  param8: string;//searchby(connected/not connected/etc...)
  param9: string;//filterbyvehicleclass
  param10: string;//fromdate
  param11: string;//todate
  param12: string;//fromtime
  param13: string;//totime
  param14: string;//vehicletype -> new/old
  param15: string;//gpsfilter -> valid/invalid'
  type: string;
  // param1?: string; // searchData (vehicle no)
  // param2: string;  // "LiveEmergencyVehicles"
  // param3?: string; // empty
  // param4: string;  // pageNo
  // param5: string;  // pagesInt
  pdfexcel: string;
}

export interface SOSAlertRequest {
  param1?: string;  // Search text
}

export interface CompanyWiseAlertResponse {
  vendorwisealerts: CompanyWiseAlert[];
}
export interface CompanyWiseAlert {
  "vendorname": string,//"APM KINGSTRACK INDIA PVT LTD",
  "vendorid": string,//"30016",
  "over_speed_count": string,//"8",
  "harsh_brake_count": string,//"0",
  "tempared_count": string,//"0",
  "sos_count": string,//"0",
  "zero_lat_long_count": string,//"46"
}
export class SOSSessionReportReq {
  "param1": string = "";//searchby
  "param2": any = "";//pageno
  "param3": any = "";//itemperpage
  "param4": string = "";//"fromdate",
  "param5": string = "";// "todate",
  "param6": string = "";// "fromtime",
  "param7": string = "";// "totime",
  "vehicleidlist": any[] = []; // vehicleId1
  "vendoridlist": any[] = []; //vendorId1
  "param10": string = ""; // "rtoid",
  "param11": string = "";// "classid"
  "pdfexcel": string = "";
}
export class SOSSessionResponse {
  param2: string = ""; // session_id
  param3: string = ""; // imeino
  param4: string = ""; // session_type
  param5: string = ""; // start_time
  param6: string = ""; // end_time
  param7: string = ""; // start_latitude
  param8: string = ""; // start_longitude
  param9: string = ""; // end_latitude
  param10: string = "";//end_longitude,
  param11: string = "";//last_alert_time
  param12: string = "";//packet_count
  param13: string = "";//status
  param14: string = "";//source_alerttypeid
  param15: string = "";//destination_alerttypei
  param16: string = "";//process_date
  param17: string = "";//vehicleno
  param18: string = "";//rtoname
  param19: string = "";//vendorname
  param20: string = "";//deviceuniqueno
  param21: string = "";//classname
}

export class VendorwiseSosSessionResponse {

}

@Injectable({
  providedIn: 'root'
})
export class AlertService extends BaseApiService {
  getSosReasonList(): Observable<ApiResponse<any>> {
    return this.apiCall<ApiResponse<any>>('/sosreasonlist', 'POST', { pagename: '' });
  }

  resolveSosSession(request: {
    param1: string; // vehicleid
    param2: string; // sessionid
    param3: string; // reasonid
    param4: string; // remarks
    pagename: 'Vehicle Status Details';
  }): Observable<ApiResponse<any>> {
    return this.apiCall<ApiResponse<any>>('/sossessionresolved', 'POST', {
      ...request,
      pagename: 'Vehicle Status Details'
    });
  }

  getOpenPanicSessionDetails(request: {
    param1: string; param2: string; param3: string;
    param4: string; param5: string; param6: string;
    param7?: string; param8?: string; rtoid?: string; pagename?: string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/openpanicsessiondetails', { ...request, pagename: request.pagename ?? 'ControlCenterDashboard' });
  }

  getPushToErssSessionDetails(request: {
    param1: string; param2: string; param3: string; param4: string;
    param5: string; param6: string; param7: string; param8: string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/pushtoersssessiondetails', request);
  }

  getPanicDashboardCount(pagename: string): Observable<ApiResponse<any>> {
    return this.post<any>('/panicdashcount', { pagename });
  }

  getVehicleClassWisePanicCounts(request: VehicleClassWiseAlertCountReq): Observable<ApiResponse<any>> {
    return this.post<any>('/vehicleclasswisepaniccounts', request);
  }

  getRtoWisePanicCounts(range?: { param1: string; param2: string }): Observable<ApiResponse<any>> {
    return this.post<any>('/rtowisepaniccounts', { pagename: '', ...range });
  }


  /**
   * Get today's alerts (for dashboard alert widget)
   */
  getTodaysAlerts(request?: AlertRequest): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_todays_alerts', {
      param1: request?.param1 || '',
      param2: request?.param2 || '1',
      param3: request?.param3 || '20',
      param4: request?.param4 || '',
      param5: request?.param5 || ''
    });
  }

  /**
   * Get today alert details (for Today Alert page)
   */
  getTodayAlert(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_today_alert', request);
  }

  /**
   * Get SOS alert details
   */
  getSOSAlert(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_sos_alert', request);
  }

  /**
   * Get panic alert details
   */
  getPanicAlert(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_panic_details', request);
  }

  /**
   * Get alert type details (for alert management)
   */
  getAlertTypeDetails(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_alerttypedetails', {});
  }

  /**
   * Get alert overview
   */
  getAlertOverview(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_alert_overview', request);
  }

  /**
   * Get alert analysis
   */
  getAlertAnalysis(request: {
    param1: string;   // searchby (Vendor/RTO)
    param2: string;   // fromDate
    param3: number;   // toDate
    param4: string;   // fromDate (API duplicate)
    param5: string;   // alertType
    param6: string;   // stateId (optional)
    param7: string;   // vehicleId
    param8: string;   // vendorId / rtoId
    param10: string;  // toDate
    param11: string;  // fromTime
    pdfexcel: string;
    // param12: string;  // toTime
  }): Observable<ApiResponse<AlertListResponse>> {

    return this.post<AlertListResponse>(
      '/psv_get_all_alert_datadetails',
      request
    );
  }

  getSosSessionReport(request: SOSSessionReportReq): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/sossessionreport', request);
  }

  getVendorwiseSosSessionReport(request: SOSSessionReportReq): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/vendorwisesossession', request);
  }

  /**
   * Get alert summary count (for alert notify)
   */
  getAlertSummaryCount(request: {
    param1: string;  // filterType (Today, Last 7 Days, etc.)
    param2: string;  // fromDate
    param3: string;  // toDate
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_alertsummarycount', request);
  }

  /**
   * Get SOS alerts
   */
  getSOSAlerts(request?: SOSAlertRequest): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_last_emergency_details', {
      param1: request?.param1 || ''
    });
  }

  /**
   * Get live emergency vehicles compliance details (using psv_get_compliancedetail)
   */
  getLiveEmergencyVehiclesCompliance(request: LiveEmergencyVehiclesRequest, showLoader: boolean = true): Observable<ApiResponse<AlertListResponse>> {
    const options = showLoader ? {} : { context: new HttpContext().set(SKIP_LOADER, true) };

    return this.post<AlertListResponse>('/psv_get_compliancedetail', {
      param1: request.param1 || '',
      param2: request.param2,
      param3: request.param3 || '',
      param4: request.param4,
      param5: request.param5,
      param6: request.param6,
      param7: request.param7,
      param8: request.param8,
      param9: request.param9,
      param10: request.param10,
      param11: request.param11,
      param12: request.param12,
      param13: request.param13,
      param14: request.param14,
      param15: request.param15,
      pdfexcel: request.pdfexcel || '',
      type: request.type
    });
  }


  /**
   * Get panic alerts
   */
  getPanicAlerts(request?: AlertRequest): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_panic_details', {
      param1: request?.param1 || '',
      param2: request?.param2 || '1',
      param3: request?.param3 || '20',
      param4: request?.param4 || '',
      param5: request?.param5 || ''
    });
  }

  /**
   * Get alert details (for alert notify and overview)
   */
  getAlertDetailsByType(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // alertType
    param5: string;  // fromDate
    param6: string;  // toDate
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_alert_details', request);
  }

  /**
   * Get dashboard alert count (for admin alerts details)
   */
  getDashboardAlertCount(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // alertType
    param5: string;  // date
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_dashboard_alert_count', request);
  }
  getUnresolvedAlertsCount(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // alertType
  }): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_alert_Unresolving_historycount', request);
  }

  /**
   * Get alert detail vehicles
   */

  getAlertDetailVehicles(
    request: any,
    showLoader: boolean = true
  ): Observable<ApiResponse<AlertListResponse>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<AlertListResponse>>(   // 🔥 yaha fix
      '/psv_get_alertdetailvehicles',
      request,
      options
    );
  }

  /**
   * Get alert unresolving history count
   */
  getAlertUnresolvingHistoryCount(
    request: any,
    showLoader: boolean = true
  ): Observable<ApiResponse<AlertListResponse>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<AlertListResponse>>(   // 🔥 FIX
      '/psv_get_alert_Unresolving_historycount',
      request,
      options
    );
  }

  /**
   * Get alert unresolving history time count
   */
  getAlertUnresolvingHistoryTimeCount(request: any): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_alert_Unresolving_historytimecount', request);
  }
  getCompanyWiseAlertsDetails(payload: any) {
    return this.post('/vendorwisealertsv2', payload);
  }
  VendorwiseFaultyDevicesCountComponent(payload: any) {
    return this.post("/psv_vendorwisefaultydevicesCount", payload);
  }
  vendorwisefaultydevicesdetails(payload: any) {
    return this.post("/psv_vendorwisefaultydevicesdetails", payload);
  }
  VendorwiseinstalleddevicecountoverallComponent(payload: any) {
    return this.post("/vendorwiseinstalledcountoverall", payload);
  }
  VendorwiseInactiveAssetsCount(payload: VendorwiseInactiveAssetsCountReq): Observable<ApiResponse<any>> {
    return this.post("/psv_vendorwiseinactivedevicescount", payload);
  }
  /**
   * Get alert configuration (SK)
   */
  getAlertConfiguration(request: {
    param1: string; // searchBy
    param2: string; // pageno
    param3: string; // itemsPerPage
    param4: string; // vendor (encrypted)
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_alert_configuration_sk', request);
  }

  /**
   * Insert alert configuration (SK)
   */
  insertAlertConfiguration(request: {
    alerttypedata: any[];
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_insert_alert_configuration_sk', request);
  }

  /**
   * Get alert type list (psv_alerttypelist)
   */
  getAlertTypeList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_alerttypelist', {});
  }

  getCurrentDayAlertsCount(
    param1: string = '',
    param2: string = '1',
    param3: string = '20',
    param4: string = ''
  ): Observable<ApiResponse<CurrentDayAlertCountResponse>> {

    return this.post<CurrentDayAlertCountResponse>(
      '/psv_get_alert_Unresolving_historycount',
      { param1, param2, param3, param4 }
    );
  }


  getCurrentDayAlertDetails(
    alertType: string,
    date: string,
    param1: string = '',
    param2: string = '1',
    param3: string = '20'
  ): Observable<ApiResponse<CurrentDayAlertDetailsResponse>> {

    return this.post('/psv_get_alertdetailvehicles', {
      param1,
      param2,
      param3,
      param4: date,
      param5: alertType,
      param6: '',
      param7: 'All',
      param8: '',
      param9: '',
      param10: '',
      pdfexcel: ''
    });
  }


  getAlertUnresolvingHistory(request: any): Observable<ApiResponse<AlertListResponse>> {
    return this.post<AlertListResponse>('/psv_get_alert_Unresolving_historytimecount', request);
  }

  getVehiclewiseAlerts(
    request: any,
    showLoader: boolean = true
  ): Observable<ApiResponse<AlertListResponse>> {

    const options = showLoader ? {} : { context: new HttpContext().set(SKIP_LOADER, true) };

    return this.http.post<ApiResponse<AlertListResponse>>(
      '/vehiclewisealertcount',
      request,
      options
    );
  }
  getAlertChartOverviewData(req: AlertGraphViewReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_alert_evaluation_count', req);
  }

  getRouteDeviationReport(request: RouteDeviationReportReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/routedeviationreport', request);
  }
  getGeofenceInOutReport(request: GeofenceInOutReportReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/geofenceinoutreport', request);
  }

  getPoliceStationDetails(request: { param1: string; param2: number; param3: number }): Observable<ApiResponse<any>> {
    return this.post<any>('/policestationdetails', request);
  }
  getUnauthorizeStoppagesReport(request: RouteDeviationReportReq): Observable<ApiResponse> {
    return this.post<ApiResponse>('/unauthorizedstoppagereport', request);
  }

  getVehicleWiseOverspeedReport(request: OverspeedReportReq): Observable<ApiResponse<OverspeedReportResponse>> {
    return this.post<OverspeedReportResponse>('/vehicleoverspeedalertcount', request);
  }

}
