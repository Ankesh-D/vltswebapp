import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

// Push Command Interfaces
export interface PushCommandRequest {
  // Keeping this interface broad since backend expects flexible payloads
  [key: string]: any;
}
export class CommonFileUploadRequest {
  filetype: any = '';
  fileextension: any = '';
  file: any = '';
  filepath: any = '';
  headerkey: any = '';
}

export interface CommandDetail {
  param1: number | string;  // srNo
  param2: string;  // commandId
  param3: string;  // companyName
  param4: string;  // deviceId
  param5: string;  // deviceName
  param6: string;  // commandType
  param7: string;  // commandValue
  param8: string;  // status
  param9: string;  // sentDate
  param10: string; // sentTime
  param11: string; // responseDate
  param12: string; // responseTime
}

export interface CommandDetailsResponse {
  listData: CommandDetail[];
  param1: number; // totalCount
}

export interface CommandDetailsRequest {
  param2: string;  // pageNumber
  param3: string;  // pageSize
  param4: string;  // companyId (encrypted)
}

// Raw Data Interfaces
export interface RawDataRequest {
  param1: string;  // deviceId
  param2: string;  // fromDate
  param3: string;  // toDate
  param4: string;  // fromTime
  param5: string;  // toTime
  param6: string;  // pageNumber
  param7: string;  // pageSize
}

export interface RawDataItem {
  param1: number | string;  // srNo
  param2: string;  // deviceId
  param3: string;  // rawData
  param4: string;  // date
  param5: string;  // time
  param6: string;  // parsedData
  param7: string;  // status
}

export interface RawDataResponse {
  listData: RawDataItem[];
  param1: number; // totalCount
}

// Assets Status Interfaces
export interface AssetsStatusRequest {
  param1: string;  // searchText
  param2: string;  // status
  param3: string;  // pageNumber
  param4: string;  // pageSize
}

export interface AssetStatusItem {
  param1: number | string;  // srNo
  param2: string;  // assetId
  param3: string;  // assetName
  param4: string;  // deviceId
  param5: string;  // vehicleId
  param6: string;  // status
  param7: string;  // lastUpdateDate
  param8: string;  // lastUpdateTime
}

export interface AssetsStatusResponse {
  listData: AssetStatusItem[];
  param1: number; // totalCount
}

// Send Health Status Interfaces
export interface SendHealthStatusRequest {
  param1: string;  // deviceId (comma-separated for multiple)
  param2: string;  // requestType (single/multiple)
}

@Injectable({
  providedIn: 'root'
})
export class OperationService extends BaseApiService {

  /**
   * Get command details
   */
  getCommandDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // companyId (encrypted, use "0" for all)
  }): Observable<ApiResponse<CommandDetailsResponse>> {
    return this.post<CommandDetailsResponse>('/psv_get_commanddetails', request);
  }

  /**
   * Insert command
   */
  insertCommand(request: {
    param1: string;  // companyId (encrypted, empty for role 11)
    param2: string;  // modelId (encrypted)
    param3: string;  // commandName
    param4: string;  // command
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_command', request);
  }

  /**
   * Update command
   */
  updateCommand(request: {
    param1: string;  // vendorId (encrypted)
    param2: string;  // modelId (encrypted)
    param3: string;  // commandId (encrypted)
    param4: string;  // commandName
    param5: string;  // command
    param6: string;  // remark (min 10 chars)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_command', request);
  }

  /**
   * Delete command
   */
  deleteCommand(request: {
    param1: string;  // commandId (encrypted)
    param3: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_command', request);
  }

  /**
   * Send command to device(s)
   */
  sendCommand(request: PushCommandRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_send_single_devicecommand', request);
  }

  /**
   * Send command to multiple devices
   */
  sendMultipleCommand(request: PushCommandRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_send_multiple_device_command', request);
  }

  /**
   * Get raw data
   */
  getRawData(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vendorId
    param5: string;  // deviceId
    param6: string;  // date
  }): Observable<ApiResponse<RawDataResponse>> {
    return this.post<RawDataResponse>('/psv_raw_data_details', request);
  }  
getNewRawData(request: {
  param1: string;
  param2: string;
  param3: string;
  param4: string;
  param5: string;
  param6: string;
  param7: string;
  param8: string;
}): Observable<ApiResponse<RawDataResponse>> {

  return this.post<RawDataResponse>(
    '/psv_raw_data_details',
    request
  );

}
  
  /**
   * Get emergency raw data
   */
  getEmergencyRawData(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
    param4: string;  // vendorId
    param5: string;  // deviceId
    param6: string;  // date
  }): Observable<ApiResponse<RawDataResponse>> {
    return this.post<RawDataResponse>('/psv_emergency_raw_data_details', request);
  }

  /**
   * Get assets status
   */
  getAssetsStatus(request: {
    param1: string;  // searchText
    param2: string;  // "LiveStatus"
    param3: string;  // ""
    param4: string;  // pageNumber
    param5: string;  // pageSize
    param6: string;  // stateFilter
    param7: string;  // districtFilter (RTO)
    param8: string;  // searchFilter (Connected, Not Connected, etc.)
    param9: string;  // vehicleClassFilter
    pdfexcel?: string; // "pdf" or "excel" for export (optional)
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_compliancedetail', request);
  }

  /**
   * Send health status request
   */
  sendHealthStatus(request: {
    param1: string;  // companyId (encrypted)
    param2: string;  // deviceId (IMEI No)
    param3: string;  // requestType (HEALTHACK)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_device_health_ack_request', request);
  }

  /**
   * Get device model list with protocol (for command entry)
   */
  getDeviceModelListWithProtocol(vendorId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_devicemodel_list_with_protocol', {
      param1: vendorId
    });
  }

  commonFileUpload(request: any): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/fileupload', request);
  }
}
