import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';
import { saveAs } from 'file-saver';
export class vehicaleInstallationRequest {
  param1: any //vehicleid
  param2: any //vehiclemakeid
  param3: any //vehiclemodelid
  param4: any //vehicleclassid
  param5: any //vehicleregno
  param6: any //vehiclechasisno
  param7: any //vehicleengineno
  param8: any //vehiclemfgyear
  param9: any //vehiclestatecode
  param10: any //vehiclertoid
  param11: any //vehicletype  --> New/Exit',
  param12: any //customername
  param13: any //customermobileno
  param14: any //loginid
  param15: any //deviceid
  param16: any //deviceimeino
  param17: any //dealerid
  param18: any//uploadedby
}

export interface Vehicle {
  param1: string;      // rowNumber
  param4: string;      // IMEI No
  param5: string;      // Serial No
  param6: string;      // ICCID No
  param7: string;      // Vendor Name
  param8: string;      // Dealer Name
  param11: string;     // Vehicle No
  param12: string;     // Chassis No
  param13: string;     // Engine No
  param14: string;     // Activation Date
  param18: string;     // RTO Name
  param19: string;     // Vehicle Type
  param26: string;     // Activation Status
  param28: string;     // Customer Name
  param29: string;     // Customer Mobile
  param40: string;     // Make Name
  param41: string;     // Model Name
  param42: string;     // Vehicle Class
  param43: string;     // Installation Date
  param45?: string;    // Polling Status
}

export interface VehicleListResponse {
  listData: Vehicle[];
  param1: number; // totalCount
}

export interface VehicleRequest {
  param1: string;  // Search text
  param2: string;  // Type (Old/New)
  param3: string;  // Page number (1-based)
  param4: string;  // Page size
  param5?: string; // Date filter
  pdfexcel?: string; // "pdf" or "excel" for export (optional)
}
export class VendorWiseCheckUpdateRequest {
  "vendorid": string = "";// "1947",
  "protocol_match": string = "true";
  "checksum_ok": string = "";
  "gps_validation": string = "";
  "auth_ok": string = "";
  "sms_ack": string = "";
  "raw_data": string = "";
  "movement_detected": string = "";
  "frequency_10s": string = "";
  "power_connected": string = "";
  "no_tamper": string = "";
  "disconnected_alert": string = "";
  "time_synced": string = "";
  "latency_ok": string = "";
  "signal_ok": string = "";
  "no_packet_loss": string = "";
  "network_stable": string = "";
  "remarks": string = "";
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService extends BaseApiService {
  protected override http = inject(HttpClient);
  getDeviceMasterDetails(data: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_device_master_details ', data);
  }
  queryCheck(data: any): Observable<ApiResponse<any>> {
    return this.post<any>('/querycheck', data);
  }
  changeUntagRequestStatus(data: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_changeuntagrequeststatus', data);
  }
  getVendorList(): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `type=${encodeURIComponent('')}&stateId=${encodeURIComponent('')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

  /**
   * Get vehicle details by type (for dashboard vehicle widget and admin device details)
   */
  getVehicleDetailsByType(
    request: any,
    showLoader: boolean = true
  ): Observable<ApiResponse<any>> {

    const payload = {
      param1: request.param1 ?? '',
      param2: request.param2 ?? '',
      param3: request.param3 ?? '',
      param4: request.param4 ?? '',
      param5: request.param5 ?? '',
      param6: request.param6 ?? '',
      param7: request.param7 ?? '',
      param8: request.param8 ?? '',
      param9: request.param9 ?? '',
      param10: request.param10 ?? '',//rtoid
      param11: request.param11 ?? '',
      param12: request.param12 ?? '',
      param13: request.param13 ?? '',
      param14: request.param14 ?? '',   // ✅ ADD THIS
      // param15: request.param15 ?? '',   // ✅ ADD THIS (optional but good)
      pdfexcel: request.pdfexcel ?? ''
    };

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<any>>(
      '/psv_get_vehicledetailsbytype',
      payload,
      options
    );
  }



  /**
   * Get asset status details (for Asset Status page)
   */
  getAssetStatusDetails(
    request: {
      param1: string;
      param2: string;
      param3: string;
      param4: string;
      param5: string;
      param6: string;
      param7: string;
      param8: string;
      param9: string;
      param14?: string; // ✅ vehicletype
      param15?: string; // ✅ gpsfilter
      param16?: string; // ✅ modefilter
      pdfexcel?: string;
      type: string;
    },
    showLoader: boolean = true
  ): Observable<ApiResponse<VehicleListResponse>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<VehicleListResponse>>(
      '/psv_get_compliancedetail',
      {
        param1: request.param1 || '',
        param2: request.param2 || '',
        param3: request.param3 || '',
        param4: request.param4 || '1',
        param5: request.param5 || '20',
        param6: request.param6 || '',
        param7: request.param7 || '',
        param8: request.param8 || '',
        param9: request.param9 || '',

        // ✅ NEW ADDED
        param14: request.param14 || '',
        param15: request.param15 || '',
        param16: request.param16 || '',

        pdfexcel: request.pdfexcel || '',
        type: request.type || 'assetstatus'
      },
      options
    );
  }

  /**
   * Get RTO list for Asset Status filters
   * API expects POST with query parameters (not body) - uses @RequestParam in Spring
   */
  getRTORoster(rtoId?: string): Observable<ApiResponse<any>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `rtoId=${encodeURIComponent(rtoId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_subrto_roster?${queryParams}`, {});
  }

  /**
   * Get Vehicle Class list for Asset Status filters
   */
  getVehicleClassRoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehicleclass_roster', {});
  }

  /**
   * Get live track data for vehicle (for map tracking)
   */
  getLiveTrack(vehicleNo: string, showLoader: boolean = true): Observable<ApiResponse<any[]>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<any[]>>(
      '/psv_get_livetrack',
      {
        param5: vehicleNo,
        param6: "activated"
      },
      options
    );
  }

 

  /**
   * Get vehicle roster details by group ID (for map tracking page)
   */
  getVehicleRosterDetailsByGroupId(
    request: {
      param1: string;
      param2: string;
      param3: string;
      param8: string; //'',//groupid
      param9: string;  //'',    //speed
      param10: string;  //this.tblviewType    //vehicletype -> new/old
      param11: string;
      param12: string; // filtername
      param13: string; // filtervalue
    },
    showLoader: boolean = true
  ): Observable<ApiResponse<any>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<any>>(
      '/psv_get_vehicle_roster_details_by_grp_id',
      {
        param1: request.param1 || '',
        param2: request.param2 || '1',
        param3: request.param3 || '10',
        param8: request.param8 || '', //'',//groupid
        param9: request.param9 || '',  //'',    //speed
        param10: request.param10 || '',  //this.tblviewType    //vehicletype -> new/old
        param11: request.param11 || '',  //accivated
        param12: request.param12 || '',  //accivated
        param13: request.param13 || ''  //accivated
      },
      options
    );
  }

  /**
   * Get vehicle roster by ID and role (for filters in reports)
   * API: /psv_get_getvehicle_roster?id=<encrypted_id>&roleId=<encrypted_roleId>
   * RoleId: "11" for Vendor, "19" for RTO
   */
  getVehicleRoster(id: string, roleId: string): Observable<ApiResponse<any[]>> {
    const queryParams = `id=${encodeURIComponent(id)}&roleId=${encodeURIComponent(roleId)}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_getvehicle_roster?${queryParams}`, {});
  }

  /**
   * Get vehicle installation details by IMEI
   */
  vehicleInstallation(request: vehicaleInstallationRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehicleinstallation', request);
  }

  /**
   * State vehicle installation
   */
  stateVehicleInstallation(request: {
    param2: string;  // vehicleMakeId
    param3: string;  // vehicleModelId
    param4: string;  // vehicleClassId
    param5: string;  // vehicleRegNo
    param6: string;  // vehicleChassisNo
    param7: string;  // vehicleEngineNo
    param8: string;  // vehicleMfgYear
    param9: string;  // vehicleStateCode
    param10: string; // vehicleRtoId
    param11: string; // vehicleType (New/Old)
    param12: string; // customerName
    param13: string; // customerMobileNo
    param15: string; // deviceId
    param16: string; // deviceImeiNo
    param17: string; // dealerId
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_statevehicleinstallation', request);
  }

  /**
   * Get vehicle details for update
   */
  getVehicleDetailsForUpdate(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<VehicleListResponse>> {
    return this.post<VehicleListResponse>('/psv_get_vehicledetailsforupdate', request);
  }

  /**
   * Update vehicle
   */
  updateVehicle(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_vehicleapi', request);
  }
  // 🔹 Get Untag Request Details
  getUntagRequestDetails(request: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_untagrequestdetails', request);
  }
  overrideVehicle(oldImei: string, reason: string): Observable<ApiResponse<string>> {

    const request = {
      param2: oldImei,
      param3: reason,
      param4: 'override'
    };

    return this.post<string>('/psv_untagdevice', request);
  }
  // 🔹 Untag Device API
  untagDevice(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_untagdevice', request);
  }
  /**
   * Activate vehicle
   */
  activateVehicle(request: {
    "param1": string,//deviceid,
    "param2": string,//otp,
    "param3": string,//mobileno,
    "param4": string,//vehicleid,
    "param6": string,
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_vehicleotpverify', request);
  }

  /**
   * Get vehicle make list
   */
  getVehicleMakeList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vehiclemake_roster', {});
  }

  /**
   * Get vehicle model list
   */
  getVehicleModelList(makeId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vehiclemode_roster?makeId=' + makeId, {});
  }

  /**
   * Change device to vehicle
   */
  changeDeviceToVehicle(request: {
    param1: string;  // vehicleId (encrypted)
    param2: string;  // oldIMEI/deviceId (encrypted)
    param3: string;  // loginId
    param4: string;  // newIMEI/deviceId (encrypted)
    param5: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_changedevicetovehicle', request);
  }

  /**
   * Get device roster for vehicle assignment
   */
  getDeviceRosterForVehicle(req: any): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(
      '/psv_get_device_roster_assign_for_vehicle',
      req
    );
  }

pushToErssSosSession(req: { param1:string, param2: string, param3: string }): Observable<ApiResponse<any>> {
  return this.post<any>('/pushtoersssossession', { param1: req.param1, param2: req.param2, param3: req.param3 });
}

  /**
   * Update vehicle activation status
   */
  updateVehicleActivationStatus(request: {
    param1: string; // vehicleid
    param2: string; // status ('Approve'/'Reject')
    param3: string; // remarks
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_updatevehicleactivationstatus', request);
  }

  // psv_send_activation_otp
  sendActivationOtp(request: {
    "param1": string, //deviceid
    "param3": string,//mobileno
    "param4": string, //vehicleid
    "param6": string, //dealermobileno
    "param10": string, //vehiclechasisno
    "param11": string  //deviceimeino
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_send_activation_otp', request);
  }

  // psv_get_checkdevicevalidity
  checkDeviceValidity(request: {
    "param1": string,//vendorid,
    "param4": string,//deviceid,
    "param5": string,//iccidno,
    "param6": string,//vehicletype,
    "param7": string,//activationdate,
    "param8": string//vehicleid
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_checkdevicevalidity', request);
  }

  /**
   * Get polling vehicle details for clustering
   */
  getPollingVehicleDetails(
    request: { param8: string },
    showLoader: boolean = true
  ): Observable<ApiResponse<any>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<any>>(
      '/psv_get_pollingvehicledetails',
      request,
      options
    );
  }

  updateVehicleMake(data: any) {
    return this.post<any>(
      '/psv_put_vehiclemake',
      data
    );
  }


  saveVehicleModel(data: any) {
    return this.http.post<any>(
      '/psv_put_vehicelmodel',
      data
    );
  }

  editVehicleModel(data: any) {
    return this.http.post<any>(
      '/psv_edit_vehicelmodel',
      data
    );
  }


  deleteVehicleModel(data: any) {
    return this.http.post<any>(
      '/psv_remove_vehicelmodel',
      data
    );
  }
  deleteVehicleMake(data: any) {
    return this.http.post<any>(
      '/psv_remove_vehiclemake',
      data
    );
  }
  saveVehicleClass(data: any) {
    return this.http.post<any>(
      '/psv_put_vehicleclass',
      data
    );
  }

  editVehicleClass(data: any) {
    return this.http.post<any>(
      '/psv_edit_vehicleclass',
      data
    );
  }


  deleteVehicleClass(data: any) {
    return this.http.post<any>(
      '/psv_delete_vehicleclass',
      data
    );
  }
  getvehicleclassdetails(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehicleclassdetails', {});
  }

  /**
   * Get vehicle history
   */
  getVehicleHistory(request: {
    param1: string; // vehicleNo
    param2: string; // date
    param3: string; // fromTime
    param4: string; // toTime
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehiclehistory?type=All', request);
  }
  updateVendorwiseInstallationCheck(request: VendorWiseCheckUpdateRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_updatechecks', request);
  }

  checkComplianceAcknowledgement(request: any): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_compliancecheck', request);
  }

  getAutoSearchVehicle(request: {
    "selectvendorid": string;
    "selectroleid": string;
    "routeid": string;
    "poiid": string;
    "selectcustomerid": string;
    "vehicleclassid": string;
    "rtoid": string;
    "searchby": string;
    "searchtype": string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/vehiclelistv2', {
      "selectvendorid": request.selectvendorid,
      "selectroleid": request.selectroleid,
      "routeid": request.routeid,
      "poiid": request.poiid,
      "selectcustomerid": request.selectcustomerid,
      "vehicleclassid": request.vehicleclassid,
      "rtoid": request.rtoid,
      "searchby": request.searchby,
      "searchtype": request.searchtype
    });
  }

  getDeviceList(request: {
    subrtoid: string;
    searchby: string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/devicelist', {
      subrtoid: request.subrtoid,
      searchby: request.searchby
    });
  }

  getVehicleListV2(payload: any): Observable<any> {
    return this.http.post('/vehiclelistv2', payload);
  }
  /**
  * Get RTO list for Asset Status filters
  * API expects POST with query parameters (not body) - uses @RequestParam in Spring
  */
  getRTORosterNew(vendorId?: string, rtoId?: string): Observable<ApiResponse<any>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `vendorid=${encodeURIComponent(vendorId || '')}&rtoId=${encodeURIComponent(rtoId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_subrto_rosterv1?${queryParams}`, {});
  }

  getVendorListNew(stateId: string = '', type: string = ''): Observable<ApiResponse<any[]>> {
    const queryParams = `stateId=${encodeURIComponent(stateId)}&type=${encodeURIComponent(type)}`;
    return this.post<any[]>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

  getClusterOnClassMap(
    request: {
      param1: string; // searchby
      param2: string; // pageno
      param3: string; // itemperpage - fetching large number for clustering
      param4: string; // vendorid
      param5: string; // rtoid
      param6: string; // vehicleclassid
      param7: string; // vehicleid
      param8: string; // new/old
      param9: string; // poiid
    },
    showLoader: boolean = true
  ): Observable<ApiResponse<any>> {

    const options = showLoader
      ? {}
      : {
        context: new HttpContext().set(SKIP_LOADER, true)
      };

    return this.http.post<ApiResponse<any>>(
      '/psv_clusteronclassmap',
      request,
      options
    );
  }

  getVehicleRoaster(request: {
    param1: string; // searchby
    param2: string; // pageno
    param3: string; // itemperpage - fetching large number for clustering
    param4: string; // vendorid
    param5: string; // rtoid
    param6: string; // vehicleclassid
    param7: string; // vehicleid
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehicle_roster', request);
  }

  deleteVehicle(request: {
    param1: string; // vehicleid
    param2: string; // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_vehicleapi', request);
  }

  updateRenewalInfo(request: {
    "iccidno": string,
    "customername": string,
    "customermobileno": string,
    "vehicleno": string,
    "chassisno": string,
    "engineno": string,
    "mfgyear": string,
    "vehicleid": string,
    "m2mproviderid": string,
    "vehiclemakeid": string,
    "vehiclemodelid": string,
    "vehicleclassid": string,
    "vehicletype": string,
    "mobileno1": string,
    "networkid1": string,
    "mobileno2": string,
    "networkid2": string,
    "rtoid": string,
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/updaterenewalvehicle', request);
  }

  commonFileDownload(printfilePath: string) {
    let lastindex = printfilePath.lastIndexOf("/");
    let fileName = printfilePath.substring(lastindex + 1, printfilePath.length)
    saveAs(printfilePath, fileName);
  }



}