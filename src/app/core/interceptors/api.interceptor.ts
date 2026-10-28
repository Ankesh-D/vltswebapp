import { HttpInterceptorFn, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { timeout, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { BaseApiService } from '../services/base-api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(BaseApiService);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  // Add base URL if not already absolute
  let apiReq = req;
  if (!req.url.startsWith('http')) {
    apiReq = req.clone({
      url: `${environment.apiUrl}${req.url}`
    });
  }
  const browserData = authService.getBrowserDetails();
    sessionStorage.setItem('brbrowsername', browserData.browsername);
    sessionStorage.setItem('browserversion', browserData.browserversion);
    sessionStorage.setItem('opersatingsys', browserData.opersatingsys);
    sessionStorage.setItem('osversion', browserData.osversion);
    // const entity: any = apiService.sessionData || {};
    // sessionStorage.setItem('username',entity.param3);
    // sessionStorage.setItem('roleid', entity.param5);
    // sessionStorage.setItem('principalKey', entity.param4);
    // sessionStorage.setItem('taskId', entity.param5);
    // sessionStorage.setItem('sessionId', this.sessionId);
  // Log request for debugging
  // //console.log('API Request:', {
  //   method: apiReq.method,
  //   url: apiReq.url,
  //   headers: Object.fromEntries(apiReq.headers.keys().map(key => [key, apiReq.headers.get(key)]))
  // });
  
  // Add common headers - use headerkey for authenticated requests (not login)
  // The backend expects 'headerkey' header (not 'principalkey')
  const principalKey = sessionStorage.getItem('principalKey')==undefined ? sessionStorage.removeItem('principalKey') : sessionStorage.getItem('principalKey');
  
  // Don't override Authentication header if it's already set (for login)
  const hasAuthHeader = req.headers.has('Authentication');
  
  // cookie header set to empty string to avoid CORS preflight issues
  const cookieHeader = sessionStorage.getItem('sessionId');
  // Check if request body is FormData (for file uploads)
  const isFormData = req.body instanceof FormData;

  if (principalKey && !hasAuthHeader) {
    if (isFormData) {
      // For FormData, don't set Content-Type - let browser set it with boundary
      apiReq = apiReq.clone({
        setHeaders: {
          'headerkey': principalKey // Backend expects 'headerkey' not 'principalkey'
        }
      });
    } else {
      const endpoint = apiReq.url.split('/').pop();
      if (endpoint == 'psv_put_roleMenu'||endpoint == 'psv_put_roleUserMenu') {
        apiReq = apiReq.clone({
          setHeaders: {
            'headerkey': principalKey, // Backend expects 'headerkey' not 'principalkey'
            'Content-Type': 'application/json'
          }
        });
      } else {
        apiReq = apiReq.clone({
          setHeaders: {
            'headerkey': principalKey, // Backend expects 'headerkey' not 'principalkey'
            'Content-Type': 'application/json'
          },
          body: apiReq.body && typeof apiReq.body === 'object' ? {
            ...apiReq.body,
            pagename: endpoint === 'sossessionresolved' ? 'Vehicle Status Details'
              : endpoint === 'sosreasonlist' ? '' : toastService.pageName
          } : apiReq.body
        });      
      }
    }
  } else if (!hasAuthHeader && !isFormData) {
    apiReq = apiReq.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Add timeout (30 seconds) and error handling
  const startTime = Date.now();
  return next(apiReq).pipe(
    tap((event: HttpEvent<any>) => {
      // Log successful responses
      if (event && (event as any).body) {
        const response = (event as any).body;
        if(response.entity == "Not Valid!") {
          let request = {
            "param4": null,
            "param5": null,
            "param6": null,
            "param7": null,
            "param8": "Web",
            "param9": "Nc4kAGZg0hWhBD3l9wd8YA==:5eef15e4c3871d8af039b15e405bf07f4d8a80ac03347eef6386cfc85a36ac93e6082114bff898776fca554b63ba7f525f308a797b8d02d338af103eb87229d6:71rnPAM4PAM9DTZsjCBZAYWXJPdA=="
          };
          
          authService.logout(request).subscribe({
            next: () => {
              localStorage.clear();
              sessionStorage.clear();
              // Cookies (non-httpOnly)
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('brbrowsername');
              sessionStorage.removeItem('browserversion');
              sessionStorage.removeItem('opersatingsys');
              sessionStorage.removeItem('osversion');
              router.navigate(['/']);
            },
            error: () => {
              localStorage.clear();
              sessionStorage.clear();
              // Cookies (non-httpOnly)
              sessionStorage.removeItem('authToken');
              sessionStorage.removeItem('brbrowsername');
              sessionStorage.removeItem('browserversion');
              sessionStorage.removeItem('opersatingsys');
              sessionStorage.removeItem('osversion');
              router.navigate(['/']);
            }
            
          });
        }
        // //console.log('API Response Success:', {
        //   url: apiReq.url,
        //   status: response?.status,
        //   statuscode: response?.statuscode,
        //   hasEntity: !!response?.entity,
        //   entityType: typeof response?.entity,
        //   entityIsArray: Array.isArray(response?.entity),
        //   elapsedTime: `${Date.now() - startTime}ms`
        // });
      }
    }),
    timeout(30000),
    catchError((error) => {
      const elapsed = Date.now() - startTime;
      // console.error('API Request Error:', {
      //   url: apiReq.url,
      //   method: apiReq.method,
      //   error: error,
      //   elapsedTime: `${elapsed}ms`,
      //   errorName: error.name,
      //   errorMessage: error.message,
      //   errorStatus: error.status,
      //   errorStatusText: error.statusText,
      //   errorBody: error.error
      // });
      
      if (error.name === 'TimeoutError' || elapsed >= 30000) {
        // console.error('Request timeout after 30 seconds:', apiReq.url);
        return throwError(() => ({
          status: 0,
          statusText: 'Request Timeout',
          message: 'The request took too long to complete. Please check your connection and try again.',
          url: apiReq.url,
          elapsedTime: elapsed
        }));
      }
      return throwError(() => error);
    })
  );

  // logout() {
  // let request = {
  //   "param4": null,
  //   "param5": null,
  //   "param6": null,
  //   "param7": null,
  //   "param8": "Web",
  //   "param9": "Nc4kAGZg0hWhBD3l9wd8YA==:5eef15e4c3871d8af039b15e405bf07f4d8a80ac03347eef6386cfc85a36ac93e6082114bff898776fca554b63ba7f525f308a797b8d02d338af103eb87229d6:71rnPAM4PAM9DTZsjCBZAYWXJPdA=="
  // };
  
  // this.authService.logout(request).subscribe({
  //   next: () => {
  //     this.clearAll();
  //     this.router.navigate(['/']);
  //   },
  //   error: () => {
  //     this.clearAll();
  //     this.router.navigate(['/']);
  //   }
  // });
  // }
};
