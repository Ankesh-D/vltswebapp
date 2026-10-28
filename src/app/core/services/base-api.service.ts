import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpContext } from '@angular/common/http';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';
export interface ApiResponse<T = any> {
  status: boolean;
  entity: T;
  statuscode: number;
  // Optional message field returned by many APIs (used in UI checks)
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  // sessionData: any;
  protected apiUrl = environment.apiUrl;
  protected http = inject(HttpClient);

  public post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${endpoint}`, body, { headers });
  }

  protected get<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${endpoint}`, { params });
  }

  protected postFile<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${endpoint}`, formData);
  }

  private getHeaders(): HttpHeaders {
    const headerkey = sessionStorage.getItem('headerkey') || sessionStorage.getItem('principalKey');
    if(headerkey) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'headerkey': headerkey
      });
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }
  }
apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: any,
  showLoader: boolean = true
): Observable<T> {

  const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${baseUrl}/${path}`;

  // ✅ IMPORTANT: yahi fix hai
  const context = showLoader
    ? new HttpContext()
    : new HttpContext().set(SKIP_LOADER, true);

  const options = {
    headers: this.getHeaders(),
    context: context
  };

  switch (method) {
    case 'GET':
      return this.http.get<T>(url, options);

    case 'POST':
      return this.http.post<T>(url, body, options);

    case 'PUT':
      return this.http.put<T>(url, body, options);

    case 'PATCH':
      return this.http.patch<T>(url, body, options);

    case 'DELETE':
      return this.http.delete<T>(url, options);
  }
}

  public AllapiCall(request: any, apiName: string): Observable<any> {
    const headers = new HttpHeaders({
      'headerkey': sessionStorage.getItem('headerkey') || ''
    });

    return this.http.post(`${this.apiUrl}${apiName}`, request, { headers });
  }

  
}
