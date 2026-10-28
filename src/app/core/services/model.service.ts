import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from './base-api.service';
import { DeviceModelDeleteReq } from '../model/request.model';
export interface ModelDeleteRequest {
  param1: string; // vendorId
  param2: string; // modelId
  param3: string; // action = DELETE
  param4: string; // remark
}

export class Model {
  param1: string = "";// Srno
  param2: string = "";// modelid
  param3: string = "";// modelcode
  param4: string = "";// modelname
  param5: string = "";// certauthagency
  param6: string = "";// modtaccertno
  param7: string = "";//(month_certDate); // taccertdate
  param8: string = "";//(month_valDate); // taccertvaildity
  param9: string = "";//(month_proDate); // proddate
  param10: string = "";//(rs.getString(9)); // copcertno
  param11: string = "";//(copcert_valDate1);
  param12: string = "";//(month_valDate1); // taccertvaildity
  param13: string = ""; // modcertupload
  param14: string = ""; // vendorid
  param15: string = "";// vendorname
  param16: string = "";// modcreatedat
  param17: string = ""; // modupdatedat
  param18: string = "";// approvedby
  param19: string = "";// isapproved
  param20: string = "";// approved_status
  param21: string = ""; // taccertpath
  param22: string = ""; // copcertpath
  param23: string = "";// modelcertpath
  param24: string = "";// brochurepath
  param25: string = ""; // protocolpath
  param26: string = ""; // isirnss
  param27: string = "";// isirnss_status
  param28: string = "";// modelcertby
  param29: string = "";// certauthcode
  param30: string = "";// certauthid
  param31: string = "";// approvedbyloginid
  param32: string = "";// reasonid
  param33: string = "";// reasonname
  param34: string = "";// copcertby
  param35: string = "";// copcertauthcode
}



export interface ModelListResponse {
  listData: Model[];
  param1: number; // totalCount
}

export interface ModelRequest {
  param1: string;  // Search text
  param2: string;  // Page number (1-based)
  param3: string;  // Page size
  pdfexcel?: string; // "pdf" or "excel" for export (optional)
}

export interface ModelEntryRequest {
  param1: string;  // modelId (0 for new)
  param2: string;  // modelCode
  param3: string;  // modelName
  param4: string;  // certAuthority
  param5: string;  // tacCertNo
  param6: string;  // tacCertDate
  param7: string;  // tacCertValidity
  param8: string;  // productionDate (MM/YY)
  param9: string;  // copCertNo
  param10: string; // copCertDate
  param11: string; // copCertValidity
  param12: string; // devmodcertupload
  param13: string; // vendorId
  param14: string; // creator loginid
  param15: string; // tac_cert_path
  param16: string; // cop_cert_path
  param17: string; // model_cert_path
  param18: string; // Brochure_path
  param19: string; // Protocol_path
  param20: string; // irnss (true/false)
  param21: string; // remark
}
export type CertificateType =
  | 'TAC'
  | 'COP'
  | 'Protocol'
  | 'CERT'
  | 'BROCHURE';

export interface ModelUpdateRequest {
  param1: string;  // modelId
  param2: string;  // modelCode
  param3: string;  // modelName
  param4: string;  // certAuthority
  param5: string;  // tacCertNo
  param6: string;  // tacCertDate
  param7: string;  // tacCertValidity
  param8: string;  // productionDate
  param9: string;  // copCertNo
  param10: string; // copCertDate
  param11: string; // copCertValidity
  param12: string; // updateReason
  param13: string; // vendorId
  param14: string; // remark
  // File paths (if updated)
  param15?: string; // tac_cert_path
  param16?: string; // cop_cert_path
  param17?: string; // model_cert_path
  param18?: string; // Brochure_path
  param19?: string; // Protocol_path
  param20?: string; // irnss
}

export interface ModelApprovalRequest {
  param1: string;  // modelId
  param2: string;  // approvalStatus (Approve/Disapprove)
  param3: string;  // remark
  param4: string;  // vendorId
  param5: string;  // action
}

export interface ModelTacValidityApprovalRequest {
  param1: string;  // modelId
  param2: string;  // approvalStatus
  param3: string;  // remark
  param4: string;  // vendorId
  param5: string;  // action
}

@Injectable({
  providedIn: 'root'
})
export class ModelService extends BaseApiService {

  /**
   * Get model details/list
   */
  getModelDetails(request: ModelRequest): Observable<ApiResponse<ModelListResponse>> {
    return this.post<ModelListResponse>('/psv_put_devicemodel_approval', {
      param1: request.param1 || '',
      param2: request.param2 || '1',
      param3: request.param3 || '20',
      pdfexcel: request.pdfexcel || ''
    });
  }

  /**
   * Create or update model
   */
  putDeviceModel(modelData: ModelEntryRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_devicemodel', modelData);
  }

  /**
   * Edit/Update model
   */
  editDeviceModel(modelData: ModelUpdateRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_edit_devicemodel', modelData);
  }

  /**
   * Get vendor roster (for dropdown)
   */
  getVendorRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_vendor_roster', {
      type: '',
      stateId: ''
    });
  }

  /**
   * Get certification authority roster (for dropdown)
   */
  getCertAuthorityRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_certauthority_roster', {});
  }

  /**
   * Get model update reason roster (for dropdown)
   */
  getModelUpdateReasonRoster(): Observable<ApiResponse<any[]>> {
    return this.post<any[]>('/psv_get_model_update_reason_roster', {});
  }

  /**
   * Approve/Disapprove model
   */
  approveModel(approvalData: ModelApprovalRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_approve_model', approvalData);
  }

  /**
   * Approve TAC Validity
   */
  approveTacValidity(approvalData: ModelTacValidityApprovalRequest): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_approve_Tac_validity', approvalData);
  }
/**
 * Delete model
 */
deleteDeviceModel(modelData: DeviceModelDeleteReq): Observable<ApiResponse<string>> {
  return this.post<string>('/psv_remove_model', modelData);
}

  /**
   * Upload certificate file
   */
uploadCertificate(
  file: File,
  certType: 'TAC' | 'COP' | 'Protocol',
  modelId: string,
  vendorId: string,
  modelName: string,
  modelCode: string,
  certNo: string,
  certDate: string,
  certValidity: string
): Observable<ApiResponse<string>> {

  const formData = new FormData();

  formData.append('file', file);
  formData.append('cerificateType', certType);
  formData.append('modelId', modelId);
  formData.append('certNo', certNo);
  formData.append('certDate', certDate);
  formData.append('certValidity', certValidity);
  formData.append('vendorId', vendorId);

  // 🔥 BACKEND MANDATORY
  formData.append('modelName', modelName);
  formData.append('modelCode', modelCode);
  formData.append('uploaddirectory', 'devicemodel');
  formData.append('copytodirectory', 'devicemodel');
  formData.append('reason', '');


  return this.postFile<string>('/psv_upload_certificate', formData);
  // uploaddirectory:
  // copytodirectory:
  // modelName:
  // modelCode:
  // reason:
  // cerificateType:
  // modelId:
  // certNo:
  // certDate:
  // certValidity: 
}




getModelDetailsForExport(request: any): Observable<any> {

  return this.post('/psv_get_devicemodeldetails', {
    param1: request.param1 || '',
    param2: '',
    param3: '',
    pdfexcel: 'excel'   // 👈 backend ko ye hi chahiye
  });
}
getModelExcel(payload: any) {
  return this.http.post(
    '/psv_get_devicemodeldetails',
    payload
  );
}

}
