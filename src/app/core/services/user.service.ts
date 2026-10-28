import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { UserCreationDetailsReq, UserCreationRequest } from '../model/request.model';
import { UserCreationDetailsResp } from '../model/response.model';

export interface User {
  param1: number;      // rowNumber
  param2?: string;     // userId
  param3: string;      // organizationName
  param4: string;      // organizationCode
  param5: string;      // contactPerson
  param6: string;      // emailId
  param7: string;      // mobileNo / alternateMobileNo
  param8: string;      // alternateMobileNo
  param9: string;      // address
  param11: string;     // cityName
  param10?: string;    // Login Name
  param12: string;     // stateName
  param13: string;     // pincode
  param17: string;     // roleName
  param20: string;     // status / activity
  param27: string;     // loginName
  param22: string;     // rtoName
}

export interface UserListResponse {
  listData: User[];
  param1: number; // totalCount
}

export interface UserRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
  param4: string;  // Count type (Total, Active, etc.)
}

export interface RTOUserDetailsRequest {
  "param2": "";  //"pageno",
  "param3": "";  //"ItemPerPage",
  "param1": "";  //"Search By "
}

export interface UserEntryRequest {
  param1: string;  // roleId (encrypted)
  param2: string;  // organizationName
  param3: string;  // organizationCode
  param4: string;  // contactPerson
  param5: string;  // emailId
  param6: string;  // mobileNo
  param7: string;  // alternateMobileNo
  param8: string;  // address
  param9: string;  // pincode
  param10: string; // loginName
  param11: string; // password
  param12: string; // stateId
  param13: string; // cityId
  param14: string; // cityName
  param15: string; // stateName
  param16: string; // district
  param17: string; // poiIcon
  param18: string; // range
  param22: string; // rtoName
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService {

  /**
   * Get user details/list
   */
  getUserDetails(request: UserRequest): Observable<ApiResponse<UserListResponse>> {
    return this.post<UserListResponse>('/psv_get_getloginuser_roster', {
      param1: request.param1 || '',
      param2: request.param2 || '',
      param3: request.param3 || '',
      param4: request.param4 || ''
    });
  }     

  // getRTOUserDetails(request: UserRequest): Observable<ApiResponse<UserListResponse>> {
  //   return this.post<UserListResponse>('/psv_userdetails', {
  //     param1: request.param1 || '',
  //     param2: request.param2 || '1',
  //     param3: request.param3 || '20',
  //   });
  // }

  getRTOUserDetails(userData: UserRequest): Observable<ApiResponse<UserListResponse>> {
    return this.post<UserListResponse>('/psv_userdetails', userData);
  }
// Get User Roster API
getUserRoster(data: any): Observable<any> {
  return this.post<any>('/psv_get_user_roster', data);
}

// Reset Password API
resetPassword(data: any): Observable<any> {
  return this.post<any>('/psv_resetpassword', data);
}
  /**
   * Create or update user
   */
  putUser(userData: UserEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_user', userData);
  }    

  putRTOUser(userData: UserEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_insertrtouser', userData);
  }

  /**
   * Get role list for user entry
   */
  getRoleListForUserEntry(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_role_list_for_userentry', {
      param1: 'userentry'
    });
  }

  /**
   * Get RTO list (for user entry when role requires RTO)
   */
  getRTORoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_rto_roster', {});
  }

  /**
   * Get state list
   */
  getStateList(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_address_state_roster', {});
  }

  /**
   * Get city list by state
   */
  getCityList(stateId: string, districtId: string = ''): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_city_roster', {
      param1: stateId,
      param2: districtId
    });
  }

  /**
   * Get district list by state
   */
  getDistrictList(stateId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_district_roster', {
      param1: stateId
    });
  }

  /**
   * Edit/Update user (get user data for editing)
   */
  getUserForEdit(userId: string): Observable<ApiResponse<User>> {
    return this.post<User>('/psv_edit_user', {
      param1: userId
    });
  }

  /**
   * Remove user
   */
  removeUser(userId: string, remark: string): Observable<ApiResponse> {
    return this.post('/psv_remove_user', {
      param1: userId,
      param3: remark
    });
  }

  /**
   * Block/Unblock user
   */
  blockUnblockUser(
    userId: string,
    remark: string,
    action: 'block' | 'unblock'
  ): Observable<ApiResponse> {
    return this.post('/psv_get_block_unblock_user', {
      param1: userId,
      param2: '',
      param3: remark,
      param5: action
    });
  }

  /**
   * Get users by role for login generation
   */
  getUsersByRole(roleId: string, filterId?: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_users_by_role_for_login', {
      param1: roleId,
      param2: filterId || ''
    });
  }

  /**
   * Get vendor user details
   */
  getVendorUserDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<UserListResponse>> {
    return this.post<UserListResponse>('/psv_get_vendor_user_details', request);
  }

  /**
   * Create vendor user
   */
  createVendorUser(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_vendor_user', request);
  }

  /**
   * Update vendor user
   */
  updateVendorUser(request: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_vendor_user', request);
  }

  /**
   * Delete vendor user
   */
  deleteVendorUser(userId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_vendor_user', {
      param1: userId,
      param3: remark
    });
  }
  // psv_get_vendor_roster?type=&stateId=
  getVendorListApi(request: any, type: any, stateid: any) {
    return this.post<string>('/psv_get_vendor_roster?type='+type+'&stateId='+stateid, request);
  }
  getRTOListApi(request: any, type: any) {
    return this.post<string>('/psv_get_rto_roster', request);
  }
  // psv_get_district_roster
  getDistrictListAPI(request: any) {
    return this.post<string>('/psv_get_district_roster', request);
  }
  // psv_get_user_wise_login_roster
  getUserWiseLoginRoster(request: any, ownersid: any, roleid: any) {
    return this.post<string>('/psv_get_user_wise_login_roster?comp_rtoid='+ ownersid+'&roleid='+roleid, request);
  }

  activeInactiveUSERs(request: any): Observable<ApiResponse> {
    return this.post('/updatertouserstatus', request);
  }
  userCreationEntry(request:UserCreationRequest): Observable<ApiResponse> {
    return this.post('/createuser', request);
  }

  getUsersDetails(userData: UserCreationDetailsReq): Observable<ApiResponse<UserCreationDetailsResp>> {
    return this.post<UserCreationDetailsResp>('/psv_get_userdetails', userData);
  }
}
