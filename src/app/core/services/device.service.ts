import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { delay, tap } from 'rxjs/operators';
import { BackendConnectedDeviceReq, CheckHealthAckDetailsReq, DeviceHealthAckSendReq, smsAcknowledgedetailsReq, UntagRequestDetailsReq } from '../model/request.model';
import { BackendConnDeviceResponse } from '../model/response.model';
import { HttpParams } from '@angular/common/http';
export interface Device {
  param1: string;      // rowNumber
  param2?: string;     // Vehicle ID or other
  param3?: string;     // Device ID or other
  param4: string;      // IMEI No
  param5: string;      // Serial No
  param6: string;      // ICCID No
  param7: string;      // Vendor Name
  param8?: string;     // Dealer Name
  param10?: string;    // Vehicle ID / mapping ID
  param11?: string;    // Vehicle/Chassis No
  param12?: string;    // Vehicle No / chassis alternative
  param14?: string;    // Activation Date
  param18?: string;    // RTO Name
  param19?: string;    // Vehicle Type
  param25?: string;    // Activation Status
  param26: string;     // Activation Status
  param27?: string;    // Customer ID / old owner ID when returned
  param28?: string;    // Customer Name
  param29?: string;    // Customer Mobile
  param43?: string;    // Installation Date
  param45?: string;    // Polling Status
  param56?: string;    // M2M Code
  param67?: string;    // Installation Date (alternative format)
  [key: string]: any;  // Additional properties for flexible response handling
}

export interface DeviceListResponse {
  listData: Device[];
  param1: number; // totalCount
}

export class FreeDevice {
  param1: string = "";      // rowNumber
  param2: string = "";      // Device ID
  param3: string = "";      // IMEI No
}
export class FreeDevicesResponse {
  listData: FreeDevice[] = []
}

export interface DeviceRequest {
  param1: string;  // Search text
  param2: string;  // Filter type (TotalDevice, Activated, Pending, Today's Installation, Never Received, Not Received)
  param3: string;  // Page number (1-based)
  param8?: string;  // Page size
  param9?: string; // Vendor ID (encrypted)
  param10?: string; // RTO ID (encrypted)
  pdfexcel: string;
}

export interface PendingVehicleDetailsRequest {
  param1: string;  // Search text
  param2: string;  // Page number
  param3: string;  // Items per page
  param4: string;  // Vendor ID
}
// export interface AssetsDetailsRequest {
//   param1?: string;   // Search text / keyword
//   param2?: number;   // Page number
//   param3?: number;   // Page size
//   param4?: string;   // Extra filter (reserved)
//   param5?: string;   // Vendor Id
//   param6?: string;   // RTO Id
//   param7?: string;   // Status / Type filter
// }
export interface AssetsDetailsRequest {
  param1?: string;
  param2?: any;
  param3?: any;
  param4?: string;
  param5?: string;
  param6?: string;
  param7?: string;

  param8?: string;
  param9?: string;
  param10?: string;
  param11?: string;
  param12?: string;
  param13?: string;
  pdfexcel?: string;
}

export interface TransferVehicleRequest {
  param1: string; // vehicle id
  param2: string; // current/old owner id when supplied by vehicle API
  param3: string; // new permit holder/customer id
  param4: string; // remark
}

export interface PermitHolderSearchRequest {
  param1: string; // search text
  param2: string; // page number
  param3: string; // page size
}
export interface RenewalDetailsRequest {
    "param1": string;
    "param2": string; //pageno
    "param3": string; //ItemPerPage
    "param4": string; //// searchtype
    "param5": string; //fromdate
    "param6": string; //todate
    "param7": string;//selectcompanyid
    "param8": string;//selectsubrtoid
    "param9": string;//dealerid
    "param10":  string;//filtername
    "param11":  string;//filtervalue
    "param12":  string;//filter1-> MVI,
    "param13":  string;//filter -> Pending /Approved
    "pdfexcel": string;//pdf/excel
}
export class FirmwareDetailsReq {
  param1: string = ""; // search text
  param2: any = ""; // page number
  param3: any = ""; // page size

}
export class FirmwareDetailsResp {
  param1: string = ""; // search text
  param2: string = ""; // page number
  param3: string = ""; // page size
  param4: string = ""; // search text
  param5: string = ""; // page number
  param6: string = ""; // page size
  param7: string = ""; // search text
  param8: string = ""; // page number
  param9: string = ""; // page size
  param10: string = "";
  param11: string = "";
}



@Injectable({
  providedIn: 'root'
})
export class DeviceService extends BaseApiService {
  // 🔴 SEND OTP FOR VEHICLE DELETE
  sendDeleteOtp(request: {
    param1: string,
    param2: string, // mobile no
    param3: string, // "vehicle"
    param4: string, // device id
    param5: string,
    param6: string,
    param7: string
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_sendotpforvehicledelete', request);
  }
  getNotActivatedDeviceList(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_notactivateddevicelist', {});
  }

  forceActivateDevices(request: {
    param1: string;  // comma separated IMEI numbers
    param2: string;  // comma separated device ids
    param3: string;  // user id
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_force_activate_devices', request);
  }

  forcefullyActiveDevice(request: {
    param1: string;  // vehicleId
    param2: string;  // deviceId
    param3: 'polling' | 'emr' | 'smsack' | 'simvalidity' | 'otp' | 'activate';
    param4: string;  // check
    param5: string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_forcefullyactivedevice', request);
  }

  updateForceInstallSimValidity(request: {
    param1: string;  // ICCID
    param2: string;  // VendorName
    param3: string;  // VendorCode
    param4: string;  // SimProvider
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_edit_sim_validity', request);
  }

  checkForceInstallCompliance(request: {
    deviceid: string;
    time_synced: string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_compliancecheck', request);
  }

  getPendingVehicleDetails(request: PendingVehicleDetailsRequest): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_pendingvehicledetails', {
      param1: request.param1 || '',
      param2: request.param2 || '',
      param3: request.param3 || '',
      param4: request.param4 || ''
    });
  }

  pushAlertToDevices(request: {
    param1: string;  // comma separated IMEI numbers
    param2: string;  // comma separated device ids
    param3: string;  // user id
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_push_alert_devices', request);
  }

  pushValidityToDevices(request: {
    param1: string;  // comma separated IMEI numbers
    param2: string;  // comma separated device ids
    param3: string;  // user id
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_push_validity_devices', request);
  }
  // 🔵 VERIFY OTP
  verifyOtp(request: {
    param1: string, // mobile no
    param2: string, // otp
    param3: string, // "vehicle"
    param4: string, // device id
    param5: string,
    param6: string,
    param7: string,
    param8: string
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_verifyotp', request);
  }
  // ❌ DELETE VEHICLE
  deleteVehicle(request: {
    param1: string, // mapping id (param10)
    param3: string  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_vehicleapi', request);
  }

  /**
   * Get device details by type (for dashboard device widget)
   */
  getDeviceDetailsByType(request: DeviceRequest): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_device_master_details', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param8: request.param8 || '',
      param9: request.param9 || '',
      param10: request.param10 || '',
      pdfexcel: ''
    });
  }
  getAssetsDetails(
    request: AssetsDetailsRequest
  ): Observable<any> {

    const payload = {
      param1: request.param1 ?? '',
      param2: request.param2 ?? 1,
      param3: request.param3 ?? 20,
      param4: request.param4 ?? '',
      param5: request.param5 ?? '',
      param6: request.param6 ?? '',
      param7: request.param7 ?? '',

      param8: request.param8 ?? '',
      param9: request.param9 ?? '',
      param10: request.param10 ?? '',
      param11: request.param11 ?? '',
      param12: request.param12 ?? '',
      param13: request.param13 ?? '',
      pdfexcel: request.pdfexcel ?? ''
    };
    return this.post<any>(
      '/psv_get_vehicledetails',
      payload
    );
  }

  /**
   * Get device master details (for device management page)
   */
  getDeviceMasterDetails(request: any, showLoader = true): Observable<ApiResponse<DeviceListResponse>> {
    const payload = {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param8: request.param8 || '',
      param9: request.param9 || '',
      param10: request.param10 || '',
      param11: request.param11 || '',
      pdfexcel: ""
    };

    return this.apiCall<ApiResponse<DeviceListResponse>>(
      '/psv_get_device_master_details',
      'POST',
      payload,
      showLoader
    );
  }
  pushEmergencyAlert(request: any): Observable<ApiResponse<any>> {
    return this.post<any>('/emrpush', request);
  }
  transferVehicle(request: TransferVehicleRequest): Observable<ApiResponse<string>> {
    console.log('[DeviceService] POST /psv_transfervehicle', request);
    return this.post<string>(
      '/psv_transfervehicle',
      request
    ).pipe(
      tap((response) => console.log('[DeviceService] /psv_transfervehicle response', response))
    );
  }

  getPermitholder(request: PermitHolderSearchRequest): Observable<ApiResponse<any>> {
    return this.post<any>(
      '/psv_get_permitholder',
      request
    );
  }
  /**
   * Get raw data device roster (for push command and raw data pages)
   * Note: This endpoint uses POST with query parameters
   */
  getRawDataDeviceRoster(vendorId: string, roleId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>(`/psv_get_rawdatadevice_roster?vendorId=${vendorId}&roleId=${roleId}`, {});
  }

  /**
   * Get device details (for update device details page)
   */
  getDeviceDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_device_master_details', request);
  }

  /**
   * Get device details for update (different endpoint)
   */
  getDeviceDetailsForUpdate(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param8: string;  // operation type: "changedevicetovehicle" or "changedevicetodealer"
    param9: string;  // vendorid
    param10: string;  // distributorid
    param11: string;  // dealerid
    pdfexcel: string; // "pdf" or "excel" for export (optional)

  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_selectdeviceapi', request);
  }

  /**
   * Update device master
   */
  updateDeviceMaster(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_devicemster', request);
  }

  /**
   * Create device
   */
  createDevice(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_device', request);
  }

  /**
   * Get device connection status
   */
  getDeviceConnection(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vendorId
    param5: string;  // deviceId
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_device_connection', request);
  }

  /**
   * Get device health
   */
  getDeviceHealth(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vendorId
    param5: string;  // date
    param6: string;  // deviceId (IMEI)
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_health_check_parsedata', request);
  }

  /**
   * Insert device health check
   */
  insertDeviceHealth(request: {
    param1: string;  // deviceId (IMEI)
    param2: string;  // date
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_device_health', request);
  }

  /**
   * Delete device
   */
  deleteDevice(request: {
    param1: string;  // deviceId (encrypted)
    param2: string;  // remark
    param3: boolean; // refundAmount
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_device', request);
  }

  /**
   * Get device model roster (for device entry)
   */
  getDeviceModelRoster(companyId?: string): Observable<ApiResponse<any[]>> {
    const queryParams = `?companyid=${encodeURIComponent(companyId ?? '')}`;
    return this.post<any[]>(`/psv_get_devicemodel_roster${queryParams}`, {});
  }

  /**
   * Get device details for change device/dealer operations
   */
  getDeviceDetailsForChange(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param8: string;  // operation type: "changedevicetovehicle" or "changedevicetodealer"
    param9: string;  // vendorid
    param10: string;  // distributorid
    param11: string;  // dealerid
    pdfexcel: string; // "pdf" or "excel" for export (optional)
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_selectdeviceapi', request);
  }

  /**
   * Change device to dealer
   */
  changeDeviceToDealer(request: {
    param1: string;  // deviceId (encrypted)
    param2: string;  // oldDealerId (encrypted)
    param3: string;  // newDealerId (encrypted)
    param5: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_changedevicetodealer', request);
  }

  /**
   * Change device to distributor
   */
  changeDeviceToDistributor(request: {
    param1: string;  // deviceId (encrypted)
    param2: string;  // oldDistributorId (encrypted)
    param3: string;  // newDistributorId (encrypted)
    param5: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/changedevicetodistributor', request);
  }

  /**
   * Get health acknowledge data
   */
  getHealthAcknowledge(request: {
    param1: string;  // vendorId (encrypted)
    param2: string;  // IMEI No
    param4: string;  // date
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_checkhealth_acknowledgement', request);
  }

  /**
   * Get device login check data
   */
  getDeviceLoginCheck(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vendorId
    param5: string;  // date
    param6: string;  // IMEI No
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_login_check_parsedata', request);
  }

  /**
   * Get port assign to vendor roster
   */
  getPortAssignToVendorRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_portassigntovendor_roster', {});
  }

  /**
   * Bulk activation - file upload
   */
  bulkActivation(formData: FormData): Observable<ApiResponse<any>> {
    return this.postFile<any>('/psv_get_bulk_activation', formData);
  }

  /**
   * Bulk device entry - file upload
   */
  bulkDeviceEntry(formData: FormData): Observable<ApiResponse<any>> {
    return this.postFile<any>('/psv_put_bulk_device_entry', formData);
  }

  /**
   * Wrapper for bulk device upload used by Multiple Device Entry form
   */
  uploadDeviceExcel(formData: FormData): Observable<ApiResponse<any>> {
    return this.bulkDeviceEntry(formData);
  }

  /**
   * Get bulk activation logs
   */
  getBulkActivationLogs(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_bulk_activation_logs', request);
  }

  /**
   * Get device bulk upload log
   */
  getDeviceBulkUploadLog(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_device_bulk_upload_log', request);
  }

  /**
   * Assign device to dealer
   */
  assignDeviceToDealer(request: {
    param1: string;  // deviceId (encrypted)
    param2: string;  // dealerId (encrypted)
    param3: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_assign_device_to_dealer', request);
  }

  /**
   * Unassign device from dealer
   */
  unassignDeviceFromDealer(request: {
    param1: string;  // deviceId (encrypted)
    param2: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_unassign_device_from_dealer', request);
  }

  /**
   * Upload firmware
   */
  uploadFirmware(request: {
    "param1": string;	//firmwareid
    "param2": string; //firmwarename
    "param3": string;	//firmwareversion
    "param4": string;	//fileid
    "param5": string;	//releasedate
    "param6": string;	//vendorid
    "param7": string;	//creator loginid
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_firmwareapi', request);
  }

   getFirmwareDetails(request: FirmwareDetailsReq): Observable<ApiResponse<FirmwareDetailsResp>> {
    return this.post<FirmwareDetailsResp>('/psv_get_firmwaredetalsaapi', request);
  }

  getBackendconnDeviceDetails(request: BackendConnectedDeviceReq): Observable<ApiResponse<BackendConnDeviceResponse>> {
      return this.post<BackendConnDeviceResponse>('/backendconndevicesdetails', request);
    }

  /**
   * Get receipt generated devices
   */
  getReceiptGeneratedDevices(request: {
    param1: string;  // fromDate (dd-M-yyyy)
    param2: string;  // toDate (dd-M-yyyy)
    param3: string;  // pageNumber
    param4: string;  // pageSize
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_receipt_details', request);
  }
  getReceiptGeneratedDevices1(request: {
    // param1: string;  // fromDate (dd-M-yyyy)
    // param2: string;  // toDate (dd-M-yyyy)
    // param3: string;  // pageNumber
    // param4: string;  // pageSize
    "param1": string,
    "param10": string,
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_receipt_details', request);
  }

  /**
   * Get inactive assets (vehicles that haven't polled in X days)
   */
  getInactiveAssets(request: {
    // param1: string,
    // param2: string,
    // param3: string;  // days (1, 3, 5, 7, 30)

    param1: string;// searchby
    param2: string;// searchtype -- DownVehicle, LiveEmergencyVehicles, LiveVehicles, Connected, NotConnected,// NeverConnected,GetStatus
    param3: string;// values
    param4: string;  // pageNumber
    param5: string;  // pageSize
    param6: string;// state
    param7: string;// discrict
    param8: string;// searchby(connected/not connected/etc...)
    param9: string;// filterbyvehicleclass
    param10: string;// fromdate
    param11: string;// todate
    param12: string;// fromtime
    param13: string;// totime
    param14: string;// vehicletype -> new/old
    param15: string;//gpsfilter -> valid/invalid'
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_compliancedetail', request);
  }

  /**
   * Get current day installation devices
   */
  getCurrentDayInstallation(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/psv_get_currentday_installation', request);
  }
  getDistributorList(request: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_distributorlist', request);
  }
  // // https://vlts.wb.gov.in/wbsdcpsvnew/psv_get_vendordealer_roster?companyid=&vendorid&distributorid
  // getDealerList(vendorId: string): Observable<ApiResponse<any[]>> {
  //   const queryParams = `companyid=${encodeURIComponent(vendorId)}`;
  //   return this.http.post<ApiResponse<any[]>>(`/psv_get_vendordealer_roster?${queryParams}`, {});
  // }
  getDealerList(
  vendorId: string,
  distributorId?: string
): Observable<ApiResponse<any[]>> {

  const params = new HttpParams()
    .set('companyid', vendorId || '')
    .set('vendorid', vendorId || '')
    .set('distributorid', distributorId || '');

  return this.http.post<ApiResponse<any[]>>(
    '/psv_get_vendordealer_roster',
    {},
    { params }
  );
}


  assignDevicesToDealer(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_assign_device_to_dealer', request);
  }
  assignDevicesToDistributor(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_assigndevicetodistributor', request);
  }
  getFreeDeviceDetailsForDealer(request: {
    param1: string;  // roleid
    param2: string;  // ownersid
  }): Observable<ApiResponse<FreeDevicesResponse>> {
    return this.post<FreeDevicesResponse>('/psv_get_device_rosterassignfordealer', request);
  }
  getFreeDeviceDetailsForDistributor(request: {}): Observable<ApiResponse<FreeDevicesResponse>> {
    return this.post<FreeDevicesResponse>('/psv_devicelist_assign_fordistributor', request);
  }



saveCommand(request: any): Observable<ApiResponse<string>> {
  return this.post<string>('/psv_insertcommand', request);
}
deleteCommand(payload: any): Observable<any> {
  return this.post('/psv_deletecommand', payload);
}
getCommandDetails(req: any): Observable<any> {
  return this.post('/psv_commanddetails', req);
}

  fetchIccidDetails(req: any): Observable<any> {
    //console.log('API CALL → fetchIccidDetails');
    //console.log('REQUEST:', req);

    // dummy response
    const response = {
      status: true,
      entity: {
        mobile: '9876543210',
        plan: 'M2M Premium Plan'
      }
    };

    return of(response).pipe(delay(800));
  }

  /* ================================
     SEND OTP (DUMMY)
     ================================ */
  sendOtp(req: any): Observable<any> {
    //console.log('API CALL → sendOtp');
    //console.log('REQUEST:', req);

    const response = {
      status: true,
      entity: 'OTP Sent Successfully'
    };

    return of(response).pipe(delay(600));
  }

  /* ================================
     CHANGE DEVICE TO VEHICLE (DUMMY)
     ================================ */
  changeDeviceToVehicle(req: any): Observable<any> {
    //console.log('API CALL → changeDeviceToVehicle');
    //console.log('REQUEST:', req);

    const response = {
      status: true,
      entity: 'Successfully Saved.'
    };

    return of(response).pipe(delay(1000));
  }
  /**
   * Remove Vehicle (Delete Asset)
   */
  removeVehicle(request: {
    param1: string;  // vehicleid
    param3: string;  // remarks
  }): Observable<ApiResponse<string>> {
    return this.post<string>(
      '/psv_remove_vehicleapi',
      request
    );
  }
  /* ================================
     GET M2M PROVIDER LIST (DUMMY)
     ================================ */
  getM2MProviderList(): Observable<ApiResponse<M2MProvider[]>> {
    return this.post<M2MProvider[]>(
      '/psv_get_m2mprovider_roster',
      {}
    );
  }
  checkDeviceValidity(request: {
    param1: string; // ICCID
    param2: string; // Provider Name
    param3: string; // Provider Short Code
    param4: string; // SIM Vendor
  }): Observable<any> {
    return this.post<any>(
      '/psv_edit_sim_validity',
      request
    );
  }

  requestInitialize(request: {
    "requestpage": string;
    "assetid": string;
    "requestvalues_new": string;
    "reasonid": string;
    "requesttype": string;
    "requestvalues_old": string;
    "remarks": string
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/changerequestentry', request);
  }
  requestDetails(request: {
    "param2": string;//"pageno",
    "param3": string;//"itemperpage",
    "param4": string;//"searchby",
    "param5": string;//"requestid"
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/changerequestdetails', request);
    // {"param1": "1","param2": "requestid","param3": "vendorid","param4": "vendorname","param5": "assetid","param6": "assetname","param7": "requestvalues_new","param8": "requestvalues_old","param9": "requesttime","param10": "requeststatus","param11": "requesttype","param12": "remarks"}
  }
  deviceRenewalDetails(request: RenewalDetailsRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/renewvehicledetails', request);
    // {"param1": "1","param2": "requestid","param3": "vendorid","param4": "vendorname","param5": "assetid","param6": "assetname","param7": "requestvalues_new","param8": "requestvalues_old","param9": "requesttime","param10": "requeststatus","param11": "requesttype","param12": "remarks"}
  }
updateCommand(payload: any): Observable<any> {
  return this.post('/psv_updatecommand', payload);
}
  updateChangeRequestStatus(request: {
    requestid: string; // requestId
    status: string; // "Approved/Rejected/Pending",
    remarks: string; // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/updatechangerequeststatus', request);
  }

  smsacknowledgeResponse(request: smsAcknowledgedetailsReq): Observable<ApiResponse<string>> {
    return this.post<string>('/smsacknowledgeresponse', request);
  }
  checkHealthAckResponse(request: CheckHealthAckDetailsReq): Observable<ApiResponse<string>> {
    return this.post<string>('/checkhealthacknowledgement', request);
  }
  checkHealthAckSend(request: DeviceHealthAckSendReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_savesmshealthrequest', request);
  }
  untaggedRequestsResponse(request: UntagRequestDetailsReq): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_untagrequestdetails', request);
  }
  notsendingdevicedatacount(): Observable<ApiResponse<DeviceListResponse>> {
    return this.post<DeviceListResponse>('/notsendingdevicedatacount', {});
  }  
}

export interface M2MProvider {
  param1: string; // providerId
  param2: string; // providerName (DISPLAY THIS)
  param3: string; // shortCode
}



