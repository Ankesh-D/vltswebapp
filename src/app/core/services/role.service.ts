import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface Role {
  param1: number;      // rowNumber
  param2: string;      // roleId
  param3: string;      // roleName
  param4: string;      // roleDescription
  param5: string;      // createdDate
}

export interface RoleListResponse {
  listData: Role[];
  param1: number; // totalCount
}

export interface RoleRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
}

export interface RoleEntryRequest {
  param1: string;  // roleName
  param2: string;  // roleDescription
}

export interface RoleUpdateRequest {
  param1: string;  // roleId
  param2: string;  // roleName
  param3: string;  // roleDescription
  param4: string;  // remark
}

export interface RoleDeleteRequest {
  param1: string;  // roleId
  param3: string;  // remark
}

@Injectable({
  providedIn: 'root'
})
export class RoleService extends BaseApiService {

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

  /**
   * Create or update role
   */
  putRole(roleData: RoleEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_role', roleData);
  }

  /**
   * Edit/Update role
   */
  editRole(roleData: RoleUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_role', roleData);
  }

  /**
   * Remove role
   */
  removeRole(roleData: RoleDeleteRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_role', roleData);
  }
}
