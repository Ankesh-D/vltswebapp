import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { OutOfOfficeHrsReportReq, VendorStatusForNewVehiclesReportReq } from '../model/request.model';

// Overspeed Report Interfaces
export interface OverspeedReportRequest {
  param1: string;  // filterType (Vendor/RTO)
  param2: string;  // filterId (vendorId/rtoId)
  param3: string;  // vehicleId
  param4: string;  // speed
  param5: string;  // fromDate
  param6: string;  // toDate
  param7: string;  // fromTime
  param8: string;  // toTime
  param9: string;  // pageNumber
  param10: string; // pageSize
}

export interface OverspeedReportItem {
  param1: number | string;  // srNo
  param2: string;  // vehicleId
  param3: string;  // vehicleNumber
  param4: string;  // chassisNumber
  param5: string;  // date
  param6: string;  // time
  param7: string;  // speed
  param8: string;  // location
  param9: string;  // latitude
  param10: string; // longitude
}

export interface OverspeedReportResponse {
  listData: OverspeedReportItem[];
  param1: number; // totalCount
}

// Distance Travelled Report Interfaces
export interface DistanceTravelledReportRequest {
  param1: string;  // vehicleId
  param2: string;  // fromDate
  param3: string;  // toDate
  param4: string;  // fromTime
  param5: string;  // toTime
  param6: string;  // pageNumber
  param7: string;  // pageSize
}

export interface DistanceTravelledReportItem {
  param1: number | string;  // srNo
  param2: string;  // vehicleId
  param3: string;  // vehicleNumber
  param4: string;  // date
  param5: string;  // distance
  param6: string;  // fromLocation
  param7: string;  // toLocation
  param8: string;  // fromTime
  param9: string;  // toTime
}

export interface DistanceTravelledReportResponse {
  listData: DistanceTravelledReportItem[];
  param1: number; // totalCount
}

// Alert Activity Report Interfaces
export interface AlertActivityReportRequest {
  param1: string;  // vehicleId
  param2: string;  // alertType
  param3: string;  // fromDate
  param4: string;  // toDate
  param5: string;  // fromTime
  param6: string;  // toTime
  param7: string;  // pageNumber
  param8: string;  // pageSize
}

export interface AlertActivityReportItem {
  param1: number | string;  // srNo
  param2: string;  // vehicleId
  param3: string;  // vehicleNumber
  param4: string;  // alertType
  param5: string;  // date
  param6: string;  // time
  param7: string;  // location
  param8: string;  // status
}

export interface AlertActivityReportResponse {
  listData: AlertActivityReportItem[];
  param1: number; // totalCount
}

// Activity Log Report Interfaces
export interface ActivityLogReportRequest {
  param1: string;  // searchText
  param2: string;  // pageNumber
  param3: string;  // pageSize
  param4: string;  // searchbytype (empty string)
  param5: string;  // fromDate
  param6: string;  // toDate
  param7: string;  // fromTime
  param8: string;  // toTime
}

export interface ActivityLogReportItem {
  param1: number | string;  // srNo
  param2: string;  // userId
  param3: string;  // userName
  param4: string;  // action
  param5: string;  // entity
  param6: string;  // date
  param7: string;  // time
  param8: string;  // ipAddress
  param9: string;  // details
}

export interface ActivityLogReportResponse {
  listData: ActivityLogReportItem[];
  param1: number; // totalCount
}

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseApiService {

  /**
   * Get overspeed report data
   */
  getOverspeedReport(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vehicleId
    param5: string;  // fromDate
    param6: string;  // fromTime
    param7: string;  // toTime
    param8: string;  // speed
    param9: string;  // vendorId
    param10: string; // rtoId
    param11: string; // toDate
  }): Observable<ApiResponse<OverspeedReportResponse>> {
    return this.post<OverspeedReportResponse>('/psv_get_overspeedreportsdetails', request);
  }

  /**
   * Get distance travelled report data
   */
  getDistanceTravelledReport(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // fromDate
    param5: string;  // toDate
    param6: string;  // fromTime
    param7: string;  // toTime
    param8: string;  // vehicleId (encrypted)
    param9: string;  // vendorId/rtoId (encrypted)
  }): Observable<ApiResponse<DistanceTravelledReportResponse>> {
    return this.post<DistanceTravelledReportResponse>('/psv_get_distance_summary_report', request);
  }

  /**
   * Get alert activity report data
   */
  getAlertActivityReport(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vehicleId (encrypted)
    param5: string;  // alertType (encrypted)
    param6: string;  // fromDate
    param7: string;  // fromTime
    param8: string;  // toTime
    param9: string;  // roleId (encrypted)
    param10: string; // vendorId/rtoId (encrypted)
    param11: string; // toDate
  }): Observable<ApiResponse<AlertActivityReportResponse>> {
    return this.post<AlertActivityReportResponse>('/psv_get_historysignlevehiclealertdetails', request);
  }

  /**
   * Get alert type details for dropdown
   */
  getAlertTypeDetails(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_alerttypedetails', {});
  }

  /**
   * Get activity log report data
   */
  getActivityLogReport(request: ActivityLogReportRequest): Observable<ApiResponse<ActivityLogReportResponse>> {
    return this.post<ActivityLogReportResponse>('/psv_get_event_logs', request);
  }
  vendorStatusForNewVehiclesReport(request: VendorStatusForNewVehiclesReportReq): Observable<ApiResponse<ActivityLogReportResponse>> {
    return this.post<ActivityLogReportResponse>('/vendorwisevehiclestatus', request);
  }

  /**
   * Get geofence entry/exit report data
   */
  getGeofenceEntryExitReport(request: {
    param1: string;  // filterType (Vendor/RTO)
    param2: string;  // filterId (vendorId/rtoId - encrypted)
    param3: string;  // vehicleId (encrypted, can be "All")
    param4: string;  // fromDate (dd-M-yyyy)
    param5: string;  // toDate (dd-M-yyyy)
    param6: string;  // fromTime (HH:mm)
    param7: string;  // toTime (HH:mm)
    param8: string;  // pageNumber
    param9: string; 
    param10: string;  // pageSize
  }): Observable<ApiResponse<GeofenceEntryExitReportResponse>> {
    return this.post<GeofenceEntryExitReportResponse>('/psv_get_geofenceinoutreport', request);
  }
 psv_get_historysignlevehiclealertdetailsexcel(data: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_historysignlevehiclealertdetails', data ,);
  }
  psv_get_all_alert_datadetailsexcel(data: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_all_alert_datadetails', data ,);
  }
 psv_get_geofenceinoutreportexcel(data: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_geofenceinoutreport', data ,);
  }
getOverspeedReportexcel(data: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_overspeedreportsdetails', data ,);
  }

  getVehicleClassWiseInstallationReport(data: any): Observable<ApiResponse<any[]>> {
  return this.post<any[]>(
    '/vehicleclasswiseintsallation',
    data
  );
}
getOutOfOfficeHrsReport(request: OutOfOfficeHrsReportReq): Observable<ApiResponse<OverspeedReportResponse>> {
    return this.post<OverspeedReportResponse>('/outofofficehoursreport ', request);
  }
 getpsvreport(request: {
  param1: string;  // vehicleId
  param2: number;  // pageNo
  param3: number;  // itemsPerPage
  param4: string;  // date
  param5: string;  // fromTime
  param6: string;  // toTime
  param7: string;
  param8: string;
   param9: string;
}): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_historydatalogreport', request);
}
}

// Geofence Entry/Exit Report Interfaces
export interface GeofenceEntryExitItem {
  param1: number | string;  // srNo
  param6: string;  // Entry Time
  param7: string;  // IN Distance
  param8: string;  // Current Status
  param9: string;  // Exit Time
  param10: string; // Out Distance
  param11: string; // POI Name
  param12: string; // Vehicle/Chassis No
  param13: string; // RTO Name
  param34?: string; // Current Status (alternative)
  [key: string]: any;
}

export interface GeofenceEntryExitReportResponse {
  listData: GeofenceEntryExitItem[];
  param1: number; // totalCount
}

