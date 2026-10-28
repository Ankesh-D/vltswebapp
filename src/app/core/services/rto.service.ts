import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface RTO {
  param1: string;      // rowNumber
  param2: string;      // rtoId
  param3: string;      // rtoName
  param4: string;      // rtoCode
  param5: string;      // stateCode
  param6: string;      // stateId
  param8: string;      // pinCode
  param9: string;      // stateName
}

export interface RTOListResponse {
  listData: RTO[];
  param1: number; // totalCount
}

export class RTORequest {
  param1: string = '';  // Search text
  param2: string = '';  // Page number (1-based)
  param3: string = '';  // Page size
  param4: string = '';  // State code
  param5: string = '';  // Count type (Total, Active, etc.)
}

export interface RTOEntryRequest {
  param1?: string;  // rtoId (for update)
  param2: string;   // rtoCode
  param3: string;   // rtoAddress
  param4: string;   // pinCode
  param5: string;   // stateId
  param7?: string;  // remark (for update)
}

@Injectable({
  providedIn: 'root'
})
export class RtoService extends BaseApiService {

  /**
   * Get RTO roster (for dropdowns)
   */
  getRTOList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_rto_roster', {});
  }

  /**
   * Get RTO details with pagination
   */
  getCityRTOList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_cityrto', {});
  }
  getRTODetails(request: RTORequest): Observable<ApiResponse<RTOListResponse>> {
    return this.post<RTOListResponse>('/psv_get_cityrto', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      param4: request.param4 || '',
      param5: request.param5 || ''
  });
  }

  /**
   * Create or update RTO
   */
  putRTO(rtoData: RTOEntryRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_put_cityrto', rtoData);
  }

  /**
   * Update RTO
   */
  editRTO(rtoData: RTOEntryRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_edit_cityrto', rtoData);
  }

  /**
   * Delete RTO
   */
  deleteRTO(rtoId: string, remark: string): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_remove_cityrto', {
      param1: rtoId,
      param3: remark
    });
  }
}
