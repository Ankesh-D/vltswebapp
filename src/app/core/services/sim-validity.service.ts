import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface SimValidity {
  param1: number | string;  // rowNumber
  param7: string;  // ICCID No
  param8: string;  // Mobile No. 1
  param9: string;  // Mobile No. 2
  param10: string; // Mobile Network 1
  param11: string; // Mobile Network 2
  param14: string; // M2M Code
  param15: string; // Vendor Name
  param45: string; // Manufacturer Code
  param50: string; // Mobile No. 1 Validity
  param51: string; // Mobile No. 2 Validity
}

export interface SimValidityListResponse {
  listData: SimValidity[];
  param1: number; // totalCount
}

export interface SimValidityRequest {
  param1: string;  // searchText
  param2: string;  // pageNumber
  param3: string;  // pageSize
}

export interface SimValidityUpdateRequest {
  param1: string;  // ICCID No
  param2: string;  // Vendor Name
  param3: string;  // Manufacturer Code
  param4: string;  // M2M Code
}

@Injectable({
  providedIn: 'root'
})
export class SimValidityService extends BaseApiService {

  /**
   * Get SIM validity details
   */
  getSimValidityDetails(request: SimValidityRequest): Observable<ApiResponse<SimValidityListResponse>> {
    return this.post<SimValidityListResponse>('/psv_get_device_master_details', request);
  }

  /**
   * Update SIM validity
   */
  updateSimValidity(request: SimValidityUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_sim_validity', request);
  }
}
