import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';

export interface POI {
  param1: number | string;  // rowNumber
  param2: string;  // poiId
  param3: string;  // poiName
  param4: string;  // poiIconPath (full path)
  param5: string;  // poiIcon (icon name or path)
  param6: string;  // range
  param7: string;  // latitude
  param8: string;  // longitude
  param9?: string; // range (alternative)
  param10?: string; // created date time
}

export interface POIListResponse {
  listData: POI[];
  param1: number; // totalCount
}

export interface POIRequest {
  param5: string;  // Search text
  param8: string;  // Page number (1-based)
  param9: string;  // Page size
}

export interface RoutePOIRequest {
  param8: string;  // search type
  param9: string;  // vehicle id
  param10: string; // trip id
}

export interface POIEntryRequest {
  param1: string;  // poiId (empty for new)
  param2: string;  // poiName
  param3: string;  // (empty)
  param4: string;  // poiIconPath (full path)
  param5: string;  // poiName (duplicate)
  param6: string;  // range
  param7: string;  // latitude
  param8: string;  // longitude
}

export interface POIUpdateRequest {
  param1: string;  // poiId
  param2: string;  // poiName
  param3: string;  // (empty)
  param4: string;  // poiIconPath
  param5: string;  // poiName (duplicate)
  param6: string;  // range
  param7: string;  // latitude
  param8: string;  // longitude
}

export interface GeofenceListRequest {
  geofenceid?: string;
}

@Injectable({
  providedIn: 'root'
})
export class POIService extends BaseApiService {

  /**
   * Get POI details/list
   */
  getPOIDetails(request: POIRequest): Observable<ApiResponse<POIListResponse>> {
    return this.post<POIListResponse>('/psv_get_poidetails', {
      param5: request.param5 || '',
      param8: request.param8 || '1',
      param9: request.param9 || '20'
    });
  }

  getRoutePOIDetails(request: RoutePOIRequest): Observable<ApiResponse<POIListResponse>> {
    return this.post<POIListResponse>('/psv_get_poidetails', {
      param8: request.param8 || '',
      param9: request.param9 || '',
      param10: request.param10 || ''
    });
  }

  /**
   * Create new POI
   */
  putNewPOI(poiData: POIEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_newpoi', poiData);
  }

  /**
   * Update POI
   */
  editPOI(poiData: POIUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_poinew', poiData);
  }

  /**
   * Delete POI
   */
  deletePOI(poiId: string, remark: string): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_remove_poinew', {
      param1: poiId,
      param2: remark
    });
  }

  /**
   * Get POI roster (for dropdowns)
   */
  getPOIRoster(): Observable<ApiResponse<POI[]>> {
    return this.post<POI[]>('/psv_get_poi_roster', {});
  }

  getGeofenceList(request: GeofenceListRequest = {}): Observable<ApiResponse<POIListResponse>> {
    return this.post<POIListResponse>('/geofencelist', {
      geofenceid: request.geofenceid || ''
    });
  }
}