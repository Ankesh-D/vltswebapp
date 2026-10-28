import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { VahanPullReq } from '../model/request.model';

export interface VahanPullRequest {
  deviceSerialNo: string;
}

export interface SimValidityUpdateRequest {
  param1: string;
  param2: string;
  param3: string;
  param4: string;
  param5: string;
  param6: string;
  param7: string;
  param8: string;
    param11: string;
      param12: string;
        param13: string;
}

export interface VahanDeviceEntryRequest {
  param2: string;  // vendorId
  param3: string;  // modelId
  param4: string;  // IMEI
  param5: string;  // serialNo
  param6: string;  // ICCID
  param8: string;  // sim1
  param9: string;  // sim2
  param10: string; // network1
  param11: string; // network2
  param12: string; // m2mProvider
  param13: string; // "Vahan"
  param14: string; // "1"
  param15: string;
  param16: string;
  param17: string;
  param19: string; // vehicleMakeNameId
  param20: string; // vehicleModelNameId
  param21: string; // vehicleClassId
  param22: string; // vehicleNo
  param23: string; // chassisNo
  param24: string; // engineNo
  param25: string; // mfgYear
  param26: string; // rtoCode
  param27: string; // rtoName
  param28: string; // vehicleType (New/Old)
  param29: string; // ownerName
  param30: string; // contactNo
  param32: string; // deviceId
  param33: string; // IMEI (duplicate)
  param34: string; // dealerNameId
  param35: string; // "Vahan"
  param36: string;
  param37: string;
  //  param38: string; //1year,2year
}

export interface VahanUploadRequest {
  jsonDeviceDataList: any[];
}

export interface VahanUploadDevicesRequest {
  param1: string;  // search
  param2: string;  // filter
  param3: string;  // page
  param4: string;  // pageSize
  param5: string;  // fromDate
  param6: string;  // toDate
  param7: string;  // source
}

@Injectable({
  providedIn: 'root'
})
export class VahanService extends BaseApiService {

  /**
   * Get Vahan pull request data by device serial number
   */
  getVahanPullRequest(deviceSerialNo: string): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vahan_pull_request', {
      deviceSerialNo: deviceSerialNo
    });
  }

  /**
   * Check vehicle details
   */
  checkVehicleDetails(param1: string, param2: string): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_check_vehicle_details', {
      param1: param1,
      param2: param2
    });
  }

  /**
   * Save Vahan device entry and installation
   */
  putVahanDeviceEntry(request: VahanDeviceEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_vahan_device_entry', request);
  }

  /**
   * Upload devices to Vahan
   */
  uploadDevicesToVahan(request: VahanUploadRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/vahanuploaddata', request);
  }

  /**
   * Get Vahan uploaded devices (success or pending)
   */
  getVahanUploadedDevices(request: VahanUploadDevicesRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_put_vahan_uploaded_devices', request);
  }

  /**
   * Get device model roster
   */
  getDeviceModelRoster(companyId?: string): Observable<ApiResponse<any>> {
    const queryParams = companyId ? `?companyid=${encodeURIComponent(companyId)}` : '?companyid=';
    return this.post<any>(`/psv_get_devicemodel_roster${queryParams}`, {});
  }

  /**
   * Get vehicle class roster
   */
  getVehicleClassRoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehicleclass_roster', {});
  }

  /**
   * Get vehicle make roster
   */
  getVehicleMakeRoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vehiclemake_roster', {});
  }

  /**
   * Get vehicle model roster by make ID
   */
  getVehicleModelRosterByMake(makeId: string): Observable<ApiResponse<any>> {
    const queryParams = `?makeId=${encodeURIComponent(makeId)}`;
    return this.post<any>(`/psv_get_vehiclemode_roster${queryParams}`, {});
  }

  /**
   * Get vendor dealer roster
   */
  getVendorDealerRoster(vendorId: string, distributorId: string = ''): Observable<ApiResponse<any[]>> {
    const queryParams = `companyid=${encodeURIComponent(vendorId)}&vendorid=${encodeURIComponent(vendorId)}&distributorid=${encodeURIComponent(distributorId)}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendordealer_roster?${queryParams}`, {});
  }

  /**
   * Get M2M provider roster
   */
  getM2MProviderRoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_m2mprovider_roster', {});
  }

  /**
   * Get network roster
   */
  getNetworkRoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_network_roster', {});
  }

  /**
   * Get RTO roster
   */
  getRTORoster(): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_rto_roster', {});
  }

  /**
   * Get Sub RTO roster
   */
  getSubRTORoster(rtoId: string): Observable<ApiResponse<any>> {
    const queryParams = `rtoId=${encodeURIComponent(rtoId)}`;
    return this.http.post<ApiResponse<any>>(`/psv_get_subrto_roster?${queryParams}`, {});
  }

  /**
   * Get vendor roster (for dealer list)
   */
  getVendorRoster(type?: string, stateId?: string): Observable<ApiResponse<any>> {
    const queryParams = `type=${type || ''}&stateId=${stateId || ''}`;
    return this.http.post<ApiResponse<any>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

putSimDetails(request: SimValidityUpdateRequest): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_put_simdetails_v1', request);
}

getSimValidityDetails(search: string, page: string, pageSize: string) {
  return this.post<any>('/psv_get_simvaliditydetails', {
    param1: search,
    param2: page,
    param3: pageSize
  });
}

psvPushToVahan(payload: any): Observable<ApiResponse<any>> {
  return this.post<any>('/psv_push_to_vahan', payload);
}
vahanPullRequest(request:VahanPullReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_vahan_pull_request', request);
  }
}
