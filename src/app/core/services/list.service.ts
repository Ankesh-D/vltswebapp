import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, BaseApiService } from './base-api.service';
import { DistributorListReq } from '../model/request.model';
export interface RoleRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
}
export interface RoleListResponse {
  listData: Role[];
  param1: number; // totalCount
}
export interface Role {
  param1: number;      // rowNumber
  param2: string;      // roleId
  param3: string;      // roleName
  param4: string;      // roleDescription
  param5: string;      // createdDate
}
@Injectable({
  providedIn: 'root'
})
export class ListService extends BaseApiService {
  /**
    * Get role details/list
    */
  getRoleDetails(request: RoleRequest): Observable<ApiResponse<RoleListResponse>> {
    return this.post<RoleListResponse>('/psv_get_roledetails', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20'
    });
  }

  getVendorList(type: string = '', stateId: string = ''): Observable<ApiResponse<any[]>> {
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `type=${encodeURIComponent(type || '')}&stateId=${encodeURIComponent(stateId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

  /**
   * Get M2M provider list
   */
  getM2MProviderList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_m2mprovider_roster', {});
  }
  getCityRTOList(rtoId: string = ''): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `rtoId=${encodeURIComponent(rtoId || '')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_subrto_roster?${queryParams}`, {});
  }

  getDistributorList(request: DistributorListReq): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_distributorlist', request);
  }
  getVendorDealerRoster(vendorId: string, distributorId: string = ''): Observable<ApiResponse<any[]>> {
    const queryParams = `companyid=${encodeURIComponent(vendorId)}&vendorid=${encodeURIComponent(vendorId)}&distributorid=${encodeURIComponent(distributorId)}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendordealer_roster?${queryParams}`, {});
  }

  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }
  /**
   * Get city list by state (same as vendor service)
   */
  getCityList(stateId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_city_roster', {
      param1: stateId,  // stateid
      param2: ''        // districtid
    });
  }

  getMVIList(rtoId: string = ''): Observable<ApiResponse<any[]>> {
    return this.http.post<ApiResponse<any[]>>(`/mvilist`, {"rtoid": rtoId});
  }
  getOEMList({}): Observable<ApiResponse<any[]>> {
    return this.http.post<ApiResponse<any[]>>(`/oemlist`, {"rtoid": {}});
  }
  getTestAgencyList({}): Observable<ApiResponse<any[]>> {
    return this.http.post<ApiResponse<any[]>>(`/psv_get_certauthority_roster`, {"rtoid": {}});
  }
  getStateRTOList({}): Observable<ApiResponse<any[]>> {
    return this.http.post<ApiResponse<any[]>>(`/psv_get_rto_roster`, {"rtoid": {}});
  }
}
