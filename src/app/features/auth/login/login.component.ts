import { DOCUMENT } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, ChangeDetectionStrategy, Renderer2 } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { ApprovedVendorRequest, AuthService, LoginRequest } from '../../../core/services/auth.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { CookieService } from 'ngx-cookie-service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ValidationsService } from '../../../core/services/validations.service';
@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, FormsModule, RouterLink],
    providers: [CookieService],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  private baseApiService = inject(BaseApiService);
  private destroy$ = new Subject<void>();
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private removeUx4gStyles?: () => void;
  private removeUx4gLoadListener?: () => void;
  private removeUx4gErrorListener?: () => void;
  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  attempterror = '';
  captchaInput = '';
  txtCaptcha = '';
  captchaValid = false;
  usernameBorder = '1px solid #ddd';
  passwordBorder = '1px solid #ddd';
  appVersion: string = '2.0.0';
  returnUrl: string = '/AdminDashboard';
  sessionId: string = '';
  vendorList: any[] = [];
  leftLogo: string='';
  webelIcon: string='';
  ux4gStylesReady = false;
  ux4gStylesError = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public cookieService: CookieService,
    public apiService: BaseApiService,
    public cv: ValidationsService,
    public encryptionService: EncryptionService,   
  ) {
    sessionStorage.setItem('pagename', 'Login Page');
    // Initialize form in constructor to ensure it's available before template renders
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    // alert('Welcome to PSV Management System');
  }

  ngOnInit() {

    this.loadUx4gStyles();
    this.leftLogo = 'assets/login/LOGO_WB.png';
    this.webelIcon = 'assets/login/Webel_logo_WBEIDC.png';
      fetch('/assets/version.json')
    .then(res => res.json())
    .then(data => {
      this.appVersion = data.version;
    });
    // this.apiService.sessionData = null;
    sessionStorage.clear();
    // Get auth token first
    this.getAuthToken();
    // Generate captcha
    this.regenerateCaptcha();
    // Get returnUrl from query parameters, default to AdminDashboard
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const returnUrlParam = params['returnUrl'];
      if (returnUrlParam) {
        // Use the returnUrl as-is (it should be like '/NewDateFilterDashboard')
        this.returnUrl = returnUrlParam.startsWith('/') ? returnUrlParam : '/' + returnUrlParam;
      } else {
        this.returnUrl = '/AdminDashboard';
      }
    });
    // 

    // Check if already authenticated - but only redirect after a small delay to prevent flash
    if (this.authService.isAuthenticated()) {
      setTimeout(() => {
        this.router.navigate([this.returnUrl]);
      }, 100);
      return;
    }



    // Watch for form changes to update button state
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cdr.detectChanges();
    });

      document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.removeUx4gLoadListener?.();
    this.removeUx4gErrorListener?.();
    this.removeUx4gStyles?.();
  }

  private loadUx4gStyles() {
    const stylesheet = this.renderer.createElement('link') as HTMLLinkElement;
    this.renderer.setAttribute(stylesheet, 'rel', 'stylesheet');
    this.renderer.setAttribute(
      stylesheet,
      'href',
      new URL('assets/ux4g/ux4g.css', this.document.baseURI).href
    );
    this.removeUx4gLoadListener = this.renderer.listen(stylesheet, 'load', () => {
      this.ux4gStylesReady = true;
      this.cdr.detectChanges();
    });
    this.removeUx4gErrorListener = this.renderer.listen(stylesheet, 'error', () => {
      this.ux4gStylesError = 'The design system styles could not load. Refresh this page to try again.';
      this.ux4gStylesReady = true;
      this.cdr.detectChanges();
    });
    this.renderer.appendChild(this.document.head, stylesheet);
    this.removeUx4gStyles = () => this.renderer.removeChild(this.document.head, stylesheet);
  }

  token: string = '';
  getAuthToken() {
    this.authService.getAuthToken().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          // Token stored in service
          this.token = response.entity;
          sessionStorage.setItem('authToken', response.entity);
        }
      },
      error: (error) => {
        ;

      }
    });
  }

  generateCaptcha(): string {
    const a = Math.ceil(Math.random() * 9) + '';
    const b = Math.ceil(Math.random() * 9) + '';
    const c = Math.ceil(Math.random() * 9) + '';
    const d = Math.ceil(Math.random() * 9) + '';
    const e = Math.ceil(Math.random() * 9) + '';
    return a + b + c + d + e;
  }

  regenerateCaptcha() {
    this.captchaInput = '';
    this.txtCaptcha = this.generateCaptcha();
    this.captchaValid = false;
    this.attempterror = '';
  }

  validateCaptcha() {
    // Trim and compare (case-sensitive as per original)
    const input = this.captchaInput.trim();
    if (input && input === this.txtCaptcha) {
      this.captchaValid = true;
      this.attempterror = '';
    } else {
      this.captchaValid = false;
    }
    // Force change detection to update button state
    this.cdr.detectChanges();
  }

  isFormValid(): boolean {
    if (!this.loginForm) {
      return false;
    }
    const username = this.loginForm.get('username')?.value?.trim();
    const password = this.loginForm.get('password')?.value?.trim();
    const captchaMatch = this.captchaInput.trim() === this.txtCaptcha;

    return !!(username && password && captchaMatch && this.captchaInput.length > 0);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  // onSubmit() {
  //   if (this.loginForm.invalid) {
  //     this.attempterror = 'Please fill all fields';
  //     if (!this.loginForm.get('username')?.value) {
  //       this.usernameBorder = '1px solid red';
  //     }
  //     if (!this.loginForm.get('password')?.value) {
  //       this.passwordBorder = '1px solid red';
  //     }
  //     return;
  //   }

  //   if (this.captchaInput !== this.txtCaptcha) {
  //     this.attempterror = 'Enter Valid Captcha';
  //     return;
  //   }

  //   this.loading = true;
  //   this.attempterror = '';
  //   this.usernameBorder = '1px solid #ddd';
  //   this.passwordBorder = '1px solid #ddd';

  //   const username = this.loginForm.get('username')?.value;
  //   const password = this.loginForm.get('password')?.value;
  //   let urldate = new Date();
  //   // this.sessionId = this.authService.encryptId(urldate.toString().replace(" ",""));
  //   // var authdata = this.authService.encryptId(username + '::' + password +'::'+this.sessionId+'::'+this.authService.authToken);
  //   // this.cookieService.set('JSESSIONID=', this.sessionId);
  //   this.authService.signIn(username, password).subscribe({
  //     next: (response) => {
  //       if (response.statuscode==200) {
  //         this.usernameBorder = '1px solid green';
  //         this.passwordBorder = '1px solid green';
  //         // Determine redirect URL based on login response (param8) or existing returnUrl
  //         const entity: any = response.entity || {};
  //         const dbRedirect: string | undefined = entity.param8;
  //         sessionStorage.setItem('username',entity.param3);
  //         sessionStorage.setItem('roleid', entity.param5);
  //         if (dbRedirect && dbRedirect !== '0') {
  //           // Example format: "#!/AssetSatus" – strip "#!/" and ensure leading slash
  //           :', dbRedirect);

  //           this.returnUrl = dbRedirect.replace(/^#!?/, '');
  //           //this.routeMappingService.mapBackendRouteToAngular(dbRedirect);
  //           
  //         }

  //         this.getMainMenuDetails()

  //       } else {
  //         this.loading = false;
  //         this.regenerateCaptcha();
  //         this.attempterror = typeof response.entity === 'string' ? response.entity : 'Invalid username or password';
  //         this.usernameBorder = '1px solid red';
  //         this.passwordBorder = '1px solid red';
  //       }
  //     },
  //     error: (error) => {
  //       this.loading = false;
  //       this.regenerateCaptcha();
  //       this.attempterror = error.error?.entity || 'Login failed. Please try again.';
  //       this.usernameBorder = '1px solid red';
  //       this.passwordBorder = '1px solid red';
  //       ;
  //     }
  //   });
  // }
  loginSessionData: any;
  onSubmit() {
    if (this.loading) {
      return;
    }

    if (this.loginForm.invalid) {
      this.attempterror = 'Please fill all fields';
      if (!this.loginForm.get('username')?.value) {
        this.usernameBorder = '1px solid red';
      }
      if (!this.loginForm.get('password')?.value) {
        this.passwordBorder = '1px solid red';
      }
      this.getAuthToken();
      return;
    }

    if (this.captchaInput !== this.txtCaptcha) {
      this.attempterror = 'Enter Valid Captcha';
      this.getAuthToken();
      return;
    }

    this.loading = true;
    this.attempterror = '';
    this.usernameBorder = '1px solid #ddd';
    this.passwordBorder = '1px solid #ddd';

    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;

    // Get browser details
    const browserData = this.authService.getBrowserDetails();
    sessionStorage.setItem('browsername', browserData.browsername);
    sessionStorage.setItem('browserversion', browserData.browserversion);
    sessionStorage.setItem('opersatingsys', browserData.opersatingsys);
    sessionStorage.setItem('osversion', browserData.osversion);

    // Encrypt credentials: username::password::sessionid::authToken
    const authData = this.encryptionService.encryptId(
      username + '::' + password + '::' + this.sessionId + '::' + this.token
    );
    // Set session cookie
    // var urldate=new Date();
	  // let sessionid=this.encryptionService.encryptId(urldate.toString().replace(" ",""));
    // document.cookie = `JSESSIONID=${sessionid}; path=/; SameSite=Strict`;

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
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authentication': authData
    });

    this.apiService.post<LoginRequest>('/psv_sign_in', requestData, headers).subscribe({
      next: (response) => {
        if (response.statuscode == 200) {
          this.usernameBorder = '1px solid green';
          this.passwordBorder = '1px solid green';
          // Determine redirect URL based on login response (param8) or existing returnUrl
          const entity: any = response.entity || {};
          
          sessionStorage.setItem('username', this.encryptionService.decryptId(entity.param3) || entity.param3);
          sessionStorage.setItem('roleid', this.encryptionService.decryptId(entity.param5) || entity.param5);
          sessionStorage.setItem('principalKey',entity.param4);
          sessionStorage.setItem('taskId', this.encryptionService.decryptId(entity.param5) || entity.param5);
          sessionStorage.setItem('sessionId', this.sessionId);
          sessionStorage.setItem('ownersid', this.encryptionService.decryptId(entity.param7) || entity.param7);
          sessionStorage.setItem('userid', this.encryptionService.decryptId(entity.param6) || entity.param6);
          sessionStorage.setItem('passwordStatus', entity.param9);
          // this.apiService.sessionData = response.entity;
          const dbRedirect: string | undefined = entity.param8;

          if (dbRedirect && dbRedirect !== '0') {
            // Example format: "#!/AssetSatus" – strip "#!/" and ensure leading slash
            // :', dbRedirect);

            this.returnUrl = dbRedirect.replace(/^#!?/, '');
            //this.routeMappingService.mapBackendRouteToAngular(dbRedirect);
sessionStorage.setItem(
  'defaultRoute',
  dbRedirect.replace('#!/', '')
);
          }

          this.getMainMenuDetails()

        } else {
          this.loading = false;
          this.regenerateCaptcha();
          this.getAuthToken();
          this.attempterror = typeof response.entity === 'string' ? response.entity : 'Invalid username or password';
          this.usernameBorder = '1px solid red';
          this.passwordBorder = '1px solid red';
        }
      },
      error: (error) => {
        this.loading = false;
        this.regenerateCaptcha();
        this.attempterror = error.error?.entity || 'Login failed. Please try again.';
        this.usernameBorder = '1px solid red';
        this.passwordBorder = '1px solid red';
        ;
      }
    });

  }

  getMainMenuDetails() {

    forkJoin({
      homeMenu: this.baseApiService.apiCall('psv_get_homemenu_list', 'POST', {}),
      subMenu: this.baseApiService.apiCall('psv_get_homesubmenu_list', 'POST', {}),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ homeMenu, subMenu }: { homeMenu: any; subMenu: any }) => {

          const menu = JSON.stringify(homeMenu.entity);

          // mainmenu
          //1 Mainmenuid
          //2 Mainmenuname
          //3 Mainmenudescription
          //4 Mainmenuurl
          //5 Parentid
          //8 Subcondition
          const submenu = JSON.stringify(subMenu.entity);
          //submenu
          //1 Submenuid
          //2 Submenuname
          //3 Submenudescription
          //4 Submenuurl
          //5 Childid
          //6 Mainmenuid
          // Store session data in cookie
          // this.cookieService.set('sessionData', JSON.stringify(this.apiService.sessionData));
          const browserData = this.authService.getBrowserDetails();
          sessionStorage.setItem('browsername', browserData.browsername);
          sessionStorage.setItem('browserversion', browserData.browserversion);
          sessionStorage.setItem('opersatingsys', browserData.opersatingsys);
          sessionStorage.setItem('osversion', browserData.osversion);
          sessionStorage.setItem('mainmenu', menu);
          sessionStorage.setItem('submenu', submenu);
          // const entity: any = this.apiService.sessionData || {};
          // sessionStorage.setItem('username',entity.param3);
          // sessionStorage.setItem('roleid', entity.param5);
          // sessionStorage.setItem('principalKey', entity.param4);
          // sessionStorage.setItem('taskId', entity.param5);
          // sessionStorage.setItem('sessionId', this.sessionId);
          // Get dashboard URL from the first menu item
          // let dashboardUrl = '/rtodashboard';
          // if (homeMenu.entity && Array.isArray(homeMenu.entity) && homeMenu.entity.length > 0) {
          //   if (homeMenu.entity[0].param4 && homeMenu.entity[0].param4 !== '0') {
          //     dashboardUrl = this.routeMappingService.mapBackendRouteToAngular(homeMenu.entity[0].param4);
          //   }
          // }
// Extract allowed routes from submenu
const allowedRoutes = subMenu.entity
  .map((m: any) => m.param4)
  .filter((url: string) => url && url !== '0')
  .map((url: string) => url.replace('#!/', ''));

sessionStorage.setItem('allowedRoutes', JSON.stringify(allowedRoutes));
          // Navigate to returnUrl if it was set (and not default), otherwise use dashboardUrl from menu
          // let redirectUrl = dashboardUrl;
          // if (this.returnUrl !== '/AdminDashboard') {
          //   redirectUrl = this.returnUrl;
          // }

          // if (!redirectUrl.startsWith('/')) {
          //   redirectUrl = '/' + redirectUrl;
          // }

          ;
          this.router.navigateByUrl(this.returnUrl);
          this.loading = false;
        },
        error: (err) => {
          ;
          this.loading = false;
          this.router.navigateByUrl(this.returnUrl);
        }
      });
  }

// vendorList: any[] = [];

openVendorModal() {

  this.authService.getVendorDetails(new ApprovedVendorRequest()).subscribe({
    next: (response: any) => {

     
      if (response.statuscode == 200) {

        this.vendorList = response.entity?.listData || [];
        this.authService.openModal('vendorModal');
        // $("#vendorModal").modal("show");
      }
    },
    error: (error) => {
      console.log(error);
    }
  });
}

redirectTOFOrgotPassword() {
  this.router.navigate(['forgotpassword'])
}
backToHome() {
  this.router.navigate(['/'])
}

}
