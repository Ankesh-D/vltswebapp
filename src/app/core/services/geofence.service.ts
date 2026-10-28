import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, BaseApiService } from './base-api.service';

export interface GeofenceDetailsRequest {
  param1: string; // vehicle id / search value
  param2: string; // page number
  param3: string; // item per page
  param4: string; // item per page
  param5: string; // item per page
}

export interface RouteDetailsForGeofenceRequest {
  param1: string; // search by
  param2: string; // page number
  param3: string; // item per page
  param4: string; // vehicleid
  param5: string; // // geofenceid
}

export interface GeofencePayload {
  geofenceid: string;
  geofencename: string;
  geofencetype: string;
  coord: string;
  radius: string;
  stylealternatecolor: string;
  categoryid: string;
  remarks?: string;
}

export interface GeofenceDeletePayload {
  geofenceid: string;
  remarks: string;
}

export interface PoiCategory {
  param1: string;
  param2: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeofenceService extends BaseApiService {
  poiCategoryList(): Observable<ApiResponse<PoiCategory[]>> {
    return this.apiCall<ApiResponse<PoiCategory[]>>('/poicategorylist', 'POST', {});
  }

  getRouteDetails(request: RouteDetailsForGeofenceRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_details', request);
  }

  getGeofenceDetails(request: GeofenceDetailsRequest): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_geofencedetails', request);
  }

  insertGeofence(payload: GeofencePayload): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_insertgeofence', payload);
  }

  updateGeofence(payload: GeofencePayload): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_updategeofence', payload);
  }

  deleteGeofence(payload: GeofenceDeletePayload): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_deletegeofence', payload);
  }
}