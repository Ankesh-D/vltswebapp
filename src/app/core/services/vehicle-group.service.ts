import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface VehicleGroup {
  param1: number | string;  // rowNumber
  param2: string;  // groupId
  param3: string;  // groupName
  param4: string;  // createDate
  param6: string;  // description
}

export interface VehicleGroupListResponse {
  listData: VehicleGroup[];
  param1: number; // totalCount
}

export interface VehicleGroupMapping {
  param1: number | string;  // rowNumber
  param2: string;  // mappingId
  param3: string;  // groupName
  param4: string;  // numberOfVehicles
  param5: string;  // createdDate
}

export interface VehicleGroupMappingListResponse {
  listData: VehicleGroupMapping[];
  param1: number; // totalCount
}

export interface GroupVehicleMappingRequest {
  groupid: string;
  groupname: string;
  groupdescription: string;
  vehicleId: string[];
  pageName: string;
  pageUrl: string;
  pageId: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleGroupService extends BaseApiService {

  /**
   * Get vehicle group details/list
   */
  getVehicleGroupDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<VehicleGroupListResponse>> {
    return this.post<VehicleGroupListResponse>('/psv_put_vehicle_group_details', request);
  }

  /**
   * Create vehicle group
   */
  createVehicleGroup(request: {
    param1: string;  // groupName
    param2: string;  // description
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_vehicle_group', request);
  }

  /**
   * Create vehicle group with selected vehicle mapping.
   */
  saveGroupVehicleMapping(request: GroupVehicleMappingRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/groupvehiclemapping', request);
  }

  /**
   * Update vehicle group
   */
  updateVehicleGroup(request: {
    param1: string;  // groupId (encrypted)
    param2: string;  // groupName
    param3: string;  // description
    param4: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_vehicle_group', request);
  }

  /**
   * Delete vehicle group
   */
  deleteVehicleGroup(request: {
    param1: string;  // groupId (encrypted)
    param2: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_vehicle_group', request);
  }

  /**
   * Get vehicle group mapping details
   */
  getVehicleGroupMappingDetails(request: {
    param1: string;  // searchText
    param2: string;  // pageNumber
    param3: string;  // pageSize
  }): Observable<ApiResponse<VehicleGroupMappingListResponse>> {
    return this.post<VehicleGroupMappingListResponse>('/psv_get_vehicle_group_mapping_details', request);
  }

  /**
   * Create vehicle group mapping
   */
  createVehicleGroupMapping(request: {
    param1: string;  // filterType (Vendor/RTO)
    param2: string;  // filterIds (comma-separated, encrypted)
    param3: string;  // vehicleIds (comma-separated, encrypted)
    param4: string;  // groupId (encrypted)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_vehicle_group_mapping', request);
  }

  /**
   * Get vehicles by group
   */
  getVehiclesByGroup(groupId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vehicles_by_group', {
      param1: groupId
    });
  }

  /**
   * Remove vehicles from group
   */
  removeVehiclesFromGroup(request: {
    param1: string;  // groupId (encrypted)
    param2: string;  // vehicleIds (comma-separated, encrypted)
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_group_mapping', request);
  }

  /**
   * Delete vehicle group mapping
   */
  deleteVehicleGroupMapping(request: {
    param1: string;  // mappingId (encrypted)
    param2: string;  // remark
  }): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_vehicle_group_mapping', request);
  }
}