import { Injectable, inject } from '@angular/core';
import { Observable, tap, switchMap, map } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseApiService, ApiResponse } from './base-api.service';
import { EncryptionService } from './encryption.service';
import { ActiveUsersReq, LoginStatusReq } from '../model/request.model';

export interface LoginRequest {
  param1: string;
  param2: string;
  param3: string;
  param4: string; // browsername
  param5: string; // browserversion
  param6: string; // opersatingsys
  param7: string; // osversion
  param8: string; // "Web"
}

export interface LoginResponse {
  param2: string; // status
  param4: string; // principalKey
  param5: string; // taskId
}
export class ApprovedVendorRequest {
  param1: string = ''; //Search By
  param2: string = ''; //pageno
  param3: string = ''; //ItemPerPage
  param4: string = ''; //vendorid
}
export class AppVendorListResponse {
  param1: string = ''; //row
  param2: string = ''; // vendorid
  param3: string = ''; // vendorname,
  param4: string = ''; // mobileno
  param5: string = ''; //emailid
  param6: string = ''; //contactpersonfname
  param7: string = '';
}
export class AnnouncementResposne {
  "param1": string = ''; // Srno
  "param2": string = ''; // id
  "param3": string = ''; //"Server Maintenance",//title
  "param4": string = ''; //"System will be down from 10 PM to 11 PM.",// message
  "param5": string = ''; //"2026-05-26 14:53:38.673216",// startdate
  "param6": string = ''; //"2026-05-27 14:53:38.673216"// enddate
  "param7": string = ''; //"High",,// priority
  "param8": string = ''; //"Popup"// notificationtype          
}
export class SendOTPForForgotPassword {
  "mobileno": string = '';
  "verifiedby": string = '';//'Emailid/Mobile';
  "otptype": string = 'ForgetPassowrd'; //'1(Registration)/2(ForgetPassowrd)/3(ResetPassword)';
  "loginid": string = '';
  "browserdetails_fcmtoken": string = '';
  "loginname": string = '';
}
export class OTPVerificationForForgotPassword {
  "otptype": string = '';//"2",
  "loginid": string = '';//"17",
  "verifiedby": string = 'Web'; //"web",
  "mobileno": string = '';//"8412963746",
  "otpcode": string = '';//"678595",
  "loginname": string = ''; //"backendadmin",
  "responsekey":""
}
export class ForgotPasswordResetReq {
  "mobileno": string = '';
  "newpassoword": string = '';
  "confirmpassword": string = '';
  "ip_devicetoken": string = '';
  "browserdetails_fcmtoken": string = '';
  "loginid": string = '';
  "loginname": string = '';
  "responsekey": string = '';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  
  public authToken: string = '';
  private sessionId: string = '';
  private encryptionService = inject(EncryptionService);

  constructor() {
    super();
  }

  encryptId(id: string): string {
			       	var key = CryptoJS.lib.WordArray.random(16);
					    var iv= CryptoJS.lib.WordArray.random(16);
					    

					    var encryptedid = CryptoJS.AES.encrypt(id, key, { iv: iv });
					    var cipherDataid = iv.toString(CryptoJS.enc.Base64)+":"+encryptedid.ciphertext.toString()+":"+key.toString(CryptoJS.enc.Base64);

					    cipherDataid = cipherDataid;
					    var indexid = cipherDataid.indexOf('+');

					    while (indexid != -1) {
					    cipherDataid = cipherDataid.replace('+', 'PAM');
					    indexid = cipherDataid.indexOf('+');
					    }
					    
					    indexid = cipherDataid.indexOf('/');

					    while (indexid != -1) {
					    cipherDataid = cipherDataid.replace('/', 'CBZ');
					    indexid = cipherDataid.indexOf('/');
					    }
					    return cipherDataid;
			      }

  /**
   * Get authentication token
   */
  getAuthToken(): Observable<ApiResponse<string>> {
    
    return this.post<string>('/psv_get_authtoken', {}).pipe(
      tap(response => {
        if (response.status && response.entity) {
          this.authToken = response.entity;
          sessionStorage.setItem('authToken', response.entity);
        }
      })
    );
  }
  getVendorDetails(request: ApprovedVendorRequest): Observable<ApiResponse<AppVendorListResponse>> {
      return this.post<AppVendorListResponse>('/approvedvendordetails', request);
    }



  /**
   * Get browser details (matching original implementation)
   */
  getBrowserDetails(): any {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';
    let osVersion = 'Unknown';

    // Detect browser
    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // Detect OS
    if (userAgent.indexOf('Windows') > -1) {
      os = 'Windows';
      const match = userAgent.match(/Windows NT (\d+\.\d+)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.indexOf('Mac') > -1) {
      os = 'Mac';
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : 'Unknown';
    } else if (userAgent.indexOf('Linux') > -1) {
      os = 'Linux';
      osVersion = 'Unknown';
    }

    return {
      browsername: browserName,
      browserversion: browserVersion,
      opersatingsys: os,
      osversion: osVersion
    };
  }

  /**
   * Sign in with encrypted credentials
   */
  signIn(username: string, password: string): Observable<ApiResponse<LoginResponse>> {
    // Ensure we have an auth token before proceeding
    // Check if token exists in memory or localStorage
    const existingToken = this.authToken || sessionStorage.getItem('authToken');
    
    // If token exists, use it; otherwise get it first
    const tokenObservable = existingToken
      ? new Observable<string>(observer => {
          this.authToken = existingToken;
          observer.next(existingToken);
          observer.complete();
        })
      : this.getAuthToken().pipe(
          tap(response => {
            if (response.status && response.entity) {
              this.authToken = response.entity;
              sessionStorage.setItem('authToken', response.entity);
            } else {
              throw new Error('Failed to retrieve authentication token');
            }
          }),
          map(() => {
            if (!this.authToken) {
              this.authToken = sessionStorage.getItem('authToken') || '';
            }
            return this.authToken;
          })
        );

    return tokenObservable.pipe(
      switchMap((token: string) => {
        if (!token) {
          throw new Error('Authentication token is required for login');
        }

        // Generate session ID
        // const urldate = new Date();
        // this.sessionId = this.encryptionService.encryptId(urldate.toString().replace(' ', ''));

        // Get browser details
        const browserData = this.getBrowserDetails();
        sessionStorage.setItem('browsername', browserData.browsername);
        sessionStorage.setItem('browserversion', browserData.browserversion);
        sessionStorage.setItem('opersatingsys', browserData.opersatingsys);
        sessionStorage.setItem('osversion', browserData.osversion);

        // Encrypt credentials: username::password::sessionid::authToken
        const authData = this.encryptionService.encryptId(
          username + '::' + password + '::' + this.sessionId + '::' + token
        );
        // Set session cookie
        // document.cookie = `JSESSIONID=${this.sessionId}; path=/; SameSite=Strict`;

        // Prepare request data
        const requestData: LoginRequest = {
          param1: '',
          param2: '',
          param3: '',
          param4: browserData.browsername,
          param5: browserData.browserversion,
          param6: browserData.opersatingsys,
          param7: browserData.osversion,
          param8: 'Web'
        };

        // Use relative endpoint - let interceptor add base URL
        return this.http.post<ApiResponse<LoginResponse>>(
          '/psv_sign_in',
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authentication': authData
            }
          }
        ).pipe(
          tap(response => {
            if (response.status && response.entity && response.entity.param4) {
              sessionStorage.setItem('principalKey', response.entity.param4);
              sessionStorage.setItem('taskId', response.entity.param5);
              sessionStorage.setItem('sessionId', this.sessionId);
            }
          })
        );
      })
    );
  }

  /**
   * Logout
   */
  logout(request: any): Observable<ApiResponse> {
    const principalkey = sessionStorage.getItem('principalKey') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': 'POST',
      'headerkey': principalkey
    });
    return this.post('/psv_get_logout', request, headers).pipe(
      tap(() => {
        this.clearAuth();
      })
    );
  }

  /**
   * Check if user is authenticated
   * Note: This only checks if principalKey exists in localStorage.
   * The principalKey should be validated with the backend on app initialization.
   */
  isAuthenticated(): boolean {
    const principalKey = sessionStorage.getItem('principalKey');
    const authToken = sessionStorage.getItem('authToken');
    const sessionId = sessionStorage.getItem('sessionId');
    
    // All three must exist for a valid session
    return !!(authToken);
    // return !!(principalKey && authToken && sessionId);
  }
  
  /**
   * Validate principalKey with backend (optional - for session validation)
   * This can be called on app initialization to verify the session is still valid
   */
  validateSession(): Observable<ApiResponse<any>> {
    // Make a lightweight API call to validate the session
    // If this fails, clear auth and redirect to login
    return this.post<any>('/psv_get_homemenu_list', {});
  }

  /**
   * Get principal key
   */
  getPrincipalKey(): string | null {
    return sessionStorage.getItem('principalKey');
  }

  /**
   * Clear authentication
   */
  apiService = inject(BaseApiService);
  clearAuth(): void {
    // this.apiService.sessionData = null;
    sessionStorage.clear();
    // localStorage.removeItem('principalKey');
    // localStorage.removeItem('taskId');
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('sessionId');
    this.authToken = '';
    this.sessionId = '';
  }

  /**
   * Forgot password - submit username
   */
  forgotPasswordSubmitUsername(request: {
    "loginname" : string; 
    "ip_devicetoken" : string; 
    "browserdetails_fcmtoken": string; 
    "verifiedby" : string; 
    "mobileno" : string; 
    "registeredby" : string;
  }): Observable<ApiResponse<any>> {
    return this.post<any>('/chkloginnameinfrgtpwd', request);
  }

  /**
   * Forgot password - send OTP
   */
  forgotPasswordSendOTP(request: SendOTPForForgotPassword): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_otpcodes', request);
  }
// psv_get_send_insert_otp_code
  /**
   * Forgot password - verify OTP
   */
  forgotPasswordVerifyOTP(request: OTPVerificationForForgotPassword): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_otp_verification_getpassword', request);
  }

  /**
   * Forgot password - reset password
   */
  forgotPasswordReset(request: ForgotPasswordResetReq): Observable<ApiResponse<string>> {
    return this.post<string>('/setforgetpassword', request);
  }

  /**
   * Reset password (admin function)
   */
  resetPassword(request: {
    param1: string; // encrypted roleId
    param2: string; // loginName
    param3: string; // otp
    param4: string; // new password
  }, headers?: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_put_changepasswordapi', request, headers);
  }

  sendOtp(mobileNo: string): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_insertotp', {
      param2: mobileNo,
      param3: "3", // otptype
      param4: "",  // ipaddress
      param5: ""   // browserdetails
    });
  }

  /**
   * Get login status
   */
  getLoginStatus(request: LoginStatusReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_logindetails_oneapi', request);
  }
  getLoggedInUserDetails(request: ActiveUsersReq): Observable<ApiResponse<any>> {
    return this.post<any>('/psv_get_logindetails_by_loginapi', request);
  }

  /**
   * Create login credentials
   */
  createLogin(request: {
    "param2": string, //encryptionData.encryptAccountId(document.getElementById("roleselector").value),
    "param3": string, //encryptionData.encryptAccountId(document.getElementById("selectUser").value),
    "param4": string,   //loginname
    "param5": string,   //password
    "param6": string,  //confirmpassword
    "param7": string, //encryptionData.encryptAccountId($scope.welcomename),
  }, headers: any): Observable<ApiResponse<string>> {
    return this.post<string>('/psv_get_createlogin', request, headers);
  }

  openModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'block';
  }
  document.body.classList.add('modal-open');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop fade show';
  document.body.appendChild(backdrop);
}
closeModal(id: string) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  document.body.classList.remove('modal-open');

  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
}

getAnnouncementDetails(request: {param1: ""}): Observable<ApiResponse<AnnouncementResposne>> {
      return this.post<AnnouncementResposne>('/announcementdetails', request);
    }
}
// announcementdetails
