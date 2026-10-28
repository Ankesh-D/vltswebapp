import { inject, Injectable } from '@angular/core';
import { ApiResponse, BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
export class Distributor {
  param1: string = ""; //distributorid 
  param2: string = ""; //distributorname
  param3: string = ""; //vendorid
  param4: string = ""; //vendorname
  param5: string = ""; //distributorgst
  param6: string = ""; //distributoraddress
  param7: string = ""; //distributorcityname
  param8: string = ""; //distributorstatename
  param9: string = ""; //distributorcontactperson
  param10:string = ""; //distributorcontactemailid
  param11:string = ""; //distributorcontactmobile
  param12:string = ""; //distributortype
  param13:string = ""; //distributorpincode
  param14:string = ""; //distributorcityid
  param15:string = ""; //distributorstateid
}

export class DistributorListResponse {
  listData: Distributor[] =[];
  param1: any = ''; // totalCount
}

export class DistributorRequest {
  param1: any = "";  // Search text
  param2: any = 1;  // Page number (1-based)
  param3: any = 20;  // Page size
  
}

export class DistributorEntryRequest {
  "param1": string =  ""; //distributorid
  "param2": string =  ""; //vendorid
  "param3": string =  "";//distributorname
  "param4": string =  "";//distributorgstno
  "param5": string =  "";//distributoraddress
  "param6": string =  "";//distributorstate
  "param7": string =  "";//distributorcity
  "param8": string =  "";//conatctpersonname
  "param9": string =  "";//conatctpersonmobileno
  "param10": string =  "";//conatctpersonemailid
  "param11": string =  "";//pincode
  "remarks": string =  "";//remarks
}
export class DistributorDeleteRequest {
  "param1": string =  ""; //distributorid
  "param2": string =  ""; //remarks

}
@Injectable({
  providedIn: 'root'
})
export class DistributorService  extends BaseApiService {
  protected override http = inject(HttpClient);
  /**
     * Get state list (same as vendor service)
     */
    getStateList(): Observable<ApiResponse<any[]>> {
      return this.post<any[]>('/psv_get_address_state_roster', {});
    }
    getCityList(stateId: string): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_city_roster', {
      param1: stateId,  // stateid
      param2: ''        // districtid
    });
  }
  getVendorList(): Observable<ApiResponse<any[]>> {
    // API uses @RequestParam, so we need query parameters in URL
    // Use relative URL so interceptor adds base URL and headers
    const queryParams = `type=${encodeURIComponent('')}&stateId=${encodeURIComponent('')}`;
    return this.http.post<ApiResponse<any[]>>(`/psv_get_vendor_roster?${queryParams}`, {});
  }

  /**
     * Get distributor details
     */
  getDistributorDetails(request: DistributorRequest): Observable<ApiResponse<Distributor[]>> {
  return this.post<Distributor[]>('/psv_distributor_details', {
    param1: request.param1 || '',
    param2: request.param2 || 1,
    param3: request.param3 || 20
  });
}
  
    /**
     * Create or insert distributor
     */
    insertDistributor(distributorData: DistributorEntryRequest): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_insert_distributor', distributorData);
    }

    /**
     * Create or update distributor
     */
    updateDistributor(distributorData: DistributorEntryRequest): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_update_distributor', distributorData);
    }

    /**
     * Create or delete distributor
     */
    deleteDistributor(distributorData: DistributorDeleteRequest): Observable<ApiResponse<any>> {
      return this.post<any>('/psv_delete_distributor', distributorData);
    }
}
