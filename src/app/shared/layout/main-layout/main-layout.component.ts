import { LoaderComponent } from './../../global-modal/loader/loader.component';
import { Component, OnInit, ViewChild, inject, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, DoCheck, ChangeDetectionStrategy, HostListener } from '@angular/core';

import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MenuService, MenuItem, SubMenuItem } from '../../../core/services/menu.service';
import { RouteMappingService } from '../../../core/services/route-mapping.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastComponent } from '../../../features/assets/inactive-assets/toast.component';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http'; 
import { ToastService } from '../../../core/services/toast.service';
import { GlobalModalComponent } from '../../../shared/global-modal/global-modal.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DeviceService } from '../../../core/services/device.service';
import moment from 'moment';
import { SidebarComponent, SidebarMenuItem } from './sidebar.component';

declare var $: any;
@Component({
    selector: 'app-main-layout',
    imports: [RouterModule, RouterOutlet, LoaderComponent, ToastComponent, FormsModule, GlobalModalComponent, SidebarComponent],
    templateUrl: './main-layout.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit, DoCheck {
  homemenulist: MenuItem[] = [];
  homesubmenulist: SubMenuItem[] = [];
  // activeSubMenu: string = '';
  welcomename = '';
  logoImg = ''; // Logo image path - set if available
  logoTitle = 'PSV System';
  vendorModal: any;
  // roleId: string = '';
  showSessionModal = false;
  androidLink: string = "https://vlts.wb.gov.in/uploaddata/entity/webelbackend.apk";
  showModal: boolean = false;
  intervalTime: string = "";
  roleId: any = sessionStorage.getItem('roleid') || '';
onSessionOk() {
  this.showSessionModal = false;
  this.logout();
}
openVendorManual() {
  window.open(
    'assets/VLTD Manufacturer User Manual_ver 1.0.pdf',
    'VendorManual',
    'width=1000,height=700,scrollbars=yes,resizable=yes'
  );
}



  private authService = inject(AuthService);
  private menuService = inject(MenuService);
  private router = inject(Router);
  private routeMappingService = inject(RouteMappingService);
  public loader = inject(ToastService);
  errorMessage: string | null = '';
idleTimeout = 10 * 60 * 1000; // 10 minutes
timeoutId: any;
  public shouldShowGlobalLoader: boolean = true; // New property to control loader
  private destroy$ = new Subject<void>(); // For managing subscriptions

  ngOnChanges(changes: SimpleChanges): void {
    
    let passwordStatus = sessionStorage.getItem('passwordStatus');
    if(passwordStatus=='0') {
      this.openResetPasswordForm();

    }
  }
  ngAfterViewInit(): void {
    if(this.roleId == '11' || this.roleId == '12' || this.roleId == '13') {
      this.notsendingdevicedatacount();
    }
    let passwordStatus = sessionStorage.getItem('passwordStatus');
    if(passwordStatus=='0') {
      this.openResetPasswordForm();
    }
  }
  ngDoCheck(): void {
    if(this.roleId == '11' || this.roleId == '12' || this.roleId == '13') {
      if(this.intervalTime && this.intervalTime != '') {
        const currentTime = moment().format('HH:mm:ss');
        if(this.intervalTime === currentTime) {
          // Do something if intervalTime is equal to the current time
          this.notsendingdevicedatacount();
        }
      }
    }
  }
  constructor(public toastSevice: ToastService, private deviceService:DeviceService) {
   
  }
  deviceCount: any = 0;
  ngOnInit() {
   
    this.showModal = true;
     this.roleId = sessionStorage.getItem('roleid') || '';
    // this.logoImg = './assets/logo.png'; // Set your logo image path here
    const encrypted = sessionStorage.getItem('username') || '';
    this.logoImg = './assets/login/LOGO_WB.png'; // Set your logo image path here
    this.welcomename = this.encryptionService.decryptUsername(encrypted) ;
    // this.loadMenus();
    // TODO: Get welcome name from user service
    this.getMenuDetails();
    
    // Subscribe to router events to control global loader visibility
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$) // Unsubscribe on component destroy
    ).subscribe((event) => {
      // Check if the current route is map-tracking-new
      if (event.urlAfterRedirects.includes('/map-tracking-new')) {
        this.shouldShowGlobalLoader = false;
      } else {
        this.shouldShowGlobalLoader = true;
      }
    });
      this.startIdleTimer();
  this.detectUserActivity();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next(); // Emit to complete all subscriptions
    this.destroy$.complete(); // Complete the subject
  }
  detectUserActivity() {
  window.addEventListener('mousemove', () => this.resetTimer());
  window.addEventListener('keydown', () => this.resetTimer());
  window.addEventListener('click', () => this.resetTimer());
  window.addEventListener('scroll', () => this.resetTimer());
}

startIdleTimer() {
  this.resetTimer();
  // //console.log("Idle timer started with timeout:", this.idleTimeout);
}
resetTimer() {

  // If user already logged out, stop timer
  if (!sessionStorage.getItem('principalKey')) {
    return;
  }

  clearTimeout(this.timeoutId);

  this.timeoutId = setTimeout(() => {

    // Double check before logout
    if (!sessionStorage.getItem('principalKey')) {
      return;
    }
this.showSessionModal = true;
    // alert("Session expired due to inactivity");
    // this.logout();

  }, this.idleTimeout);
}
  menuList: SidebarMenuItem[] = [];
  navCollapsed = true;
  mobileMenuOpen = false;
  getMenuDetails() {
    let mainMenu: any = sessionStorage.getItem('mainmenu');
    let subMenu: any = sessionStorage.getItem('submenu');
    
    
    if (mainMenu) {
      mainMenu = JSON.parse(mainMenu);
      if(subMenu) {
      subMenu = JSON.parse(subMenu)
      this.menuList = this.buildMenu(mainMenu,subMenu);
      // //console.log("menuList:", this.menuList);
    }
    }
    
      
  }
  toggleNavigation() {
    if (this.isMobileViewport) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    }
  }

  get isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (!this.isMobileViewport) {
      this.closeMobileMenu();
    }
  }

  buildMenu(mainMenuRes: MenuItem[], subMenuRes: SubMenuItem[]): SidebarMenuItem[] {
    const menuMap = new Map<string, SidebarMenuItem>();
    const submenuParents = new Map<string, string>();

    mainMenuRes
      .filter(menu => menu.param2?.toLowerCase() !== 'tab url')
      .forEach(menu => {
        const item: SidebarMenuItem = {
          id: menu.param1,
          label: menu.param2,
          children: []
        };
        if (menu.param6 === '0' && menu.param4 && menu.param4 !== '0') {
          item.route = this.normalizeMenuRoute(menu.param4);
        }
        menuMap.set(item.id, item);
      });

    subMenuRes.forEach(submenu => {
      const item: SidebarMenuItem = {
        id: submenu.param1,
        label: submenu.param2,
        children: []
      };
      if (submenu.param4 && submenu.param4 !== '0') {
        item.route = this.normalizeMenuRoute(submenu.param4);
      }
      menuMap.set(item.id, item);
      submenuParents.set(item.id, submenu.param6 || submenu.param3);
    });

    const roots: SidebarMenuItem[] = [];
    mainMenuRes
      .filter(menu => menu.param2?.toLowerCase() !== 'tab url')
      .forEach(menu => {
        const item = menuMap.get(menu.param1);
        if (!item) return;
        const parentId = submenuParents.get(item.id);
        const parent = parentId ? menuMap.get(parentId) : undefined;
        if (parent) parent.children?.push(item);
        else roots.push(item);
      });

    subMenuRes.forEach(submenu => {
      const item = menuMap.get(submenu.param1);
      const parentId = submenuParents.get(submenu.param1);
      const parent = parentId ? menuMap.get(parentId) : undefined;
      if (item && parent) parent.children?.push(item);
    });

    const hasMenuContent = (item: SidebarMenuItem): boolean =>
      Boolean(item.route || item.children?.some(hasMenuContent));
    return roots.filter(hasMenuContent);
  }

  private normalizeMenuRoute(route: string): string {
    return route.replace('#!/', '').trim();
  }

currentPassword: string = '';
newPassword: string = '';
encryptionService: any = inject(EncryptionService); // Assuming AuthService has encryption methods
confirmPassword: string = '';
@ViewChild('resetPasswordForm') resetPasswordForm!: NgForm;
showCurrentPassword: boolean =false;
showNewPassword: boolean = false;
showConfirmPassword: boolean = false;
authToken: string = "";
errorType: any = "success"
getAuthToken() {
    this.authService.getAuthToken().subscribe({
      next: (response) => {
        if (response.status && response.entity) {
          // Token stored in service
          this.authToken = response.entity;
          // sessionStorage.setItem('authToken', response.entity);
        }
      },
      error: (error) => {
        console.error('Error getting auth token:', error);

      }
    });
  }
openResetPasswordForm() {
  this.showCurrentPassword = false;
  this.showNewPassword = false;
  this.showConfirmPassword = false;

  $('#resetPasswordModal').modal('show');
  setTimeout(()=> {
    this.resetPasswordForm.resetForm();
  }, 500);
}

checkPasswordsMatch() {
    if (this.confirmPassword) {
      // let passwordsMatch = this.resetPasswordForm.value.currentPassword === this.resetPasswordForm.value.confirmPassword;
      this.toastSevice.show('The old password and new password cannot be the same.', 'error');
      return
    }
    if(this.resetPasswordForm.value.newPassword != this.resetPasswordForm.value.confirmPassword) {
       this.toastSevice.show('The new password and confirm password does notmatch.', 'error');
       return
    }
  }

resetPassword() {
 
  if(this.resetPasswordForm.valid) {
      if (this.resetPasswordForm.value.currentPassword === (this.resetPasswordForm.value.confirmPassword || this.resetPasswordForm.value.newPassword)) {
        // let passwordsMatch = this.resetPasswordForm.value.currentPassword === this.resetPasswordForm.value.confirmPassword;
        this.toastSevice.show('The old password and new password cannot be the same.', 'error');
        return
      }
      if(this.resetPasswordForm.value.newPassword != this.resetPasswordForm.value.confirmPassword) {
        this.toastSevice.show('The new password and confirm password does notmatch.', 'error');
        return
      }
    // if(this.resetPasswordForm.value.newPassword == this.resetPasswordForm.value.confirmPassword) {
      const roleId = sessionStorage.getItem('roleId') || '';
      const ownersId = sessionStorage.getItem('ownersid') || '';
      // const encryptedRoleId = this.encryptionService.encryptAccountId(roleId);
      // //console.log("loginName:"+ownersId);
      // //console.log("currentPassword:"+this.resetPasswordForm.value.currentPassword);
      // //console.log("newPassword:"+this.resetPasswordForm.value.newPassword);
      // //console.log("confirmPassword:"+this.resetPasswordForm.value.confirmPassword);
      var authData = this.encryptionService.encryptId(ownersId+":"+this.resetPasswordForm.value.currentPassword+":"+this.resetPasswordForm.value.newPassword+":"+this.resetPasswordForm.value.confirmPassword);
    //  //console.log(this.encryptionService.decryptId(authData));
      const request = {
          param1: "",
          param2: "",
          param3: "",
          param4: ""
        };
        const headerkey = sessionStorage.getItem('headerkey') || sessionStorage.getItem('principalKey') || '';
        const headers = new HttpHeaders({
              'Content-Type': 'application/json',
              'Authentication': authData,
              'headerkey': headerkey
            });
        this.authService.resetPassword(request, headers).subscribe({
          next: (response) => {
            // alert('Password reset successful.');
            if(response.statuscode == 200) {
              this.errorType = "success";
              this.errorMessage = "Password reset successful."
              $('#resetPasswordModal').modal('hide');
              this.currentPassword = '';
              this.newPassword = '';
            } else {
              this.errorType = "error";
              this.errorMessage = 'Password reset failed: ' + (response.entity || 'Unknown error')
              // alert('Password reset failed: ' + (response.message || 'Unknown error'));
            }
          },
          error: (error) => {
            this.errorType = "error";
            this.errorMessage = 'Password reset failed: ' + (error.error?.message || 'Unknown error')
            // alert('Password reset failed: ' + (error.error?.message || 'Unknown error'));
          }
        });
    // } else {
    //   this.errorMessage = "New password and confirm password should be same"
    // }

  }
}



  // loadMenus() {
  //   this.homemenulist = [];
  //   this.homesubmenulist = [];
  //   let maninmenu = sessionStorage.getItem('mainmenu');
  //   let submenu = sessionStorage.getItem('submenu');
  //   this.homemenulist = maninmenu ? JSON.parse(maninmenu) : [];
  //   this.homesubmenulist = submenu ? JSON.parse(submenu) : [];
  //   this.homesubmenulist = this.homesubmenulist.map((sub: any) => ({
  //     ...sub,
  //     param4: sub.param4.replace('#!/', '') // Normalize 'routeCreate()' to '0'
  //   }));
  //   
   
  // }

  // getSubMenus(parentId: string): SubMenuItem[] {

  //   return this.homesubmenulist.filter(sub => sub.param6 === parentId || sub.param3 === parentId);
  // }

  // showSubMenu(menuId: string) {
  //   
  //   this.activeSubMenu = menuId;
  // }

  // hideSubMenu(menuId: string) {
  //   setTimeout(() => {
  //     if (this.activeSubMenu === menuId) {
  //       this.activeSubMenu = '';
  //     }
  //   }, 200);
  // }

  // getMenuRoute(route: string): string {
  //   if (!route || route === '0') {
  //     return '';
  //   }
    
  //   // Use RouteMappingService for consistent route mapping
  //   return this.routeMappingService.mapBackendRouteToAngular(route);
  // }

  // getSubMenuRoute(route: string) {
  //   
  //   return this.getMenuRoute(route);
    
  //   // if (!route || route === 'routeCreate()' || route === '0') {
  //   //   return '';
  //   // }
    
  //   // // Use RouteMappingService for consistent route mapping
  //   // const mappedRoute = this.routeMappingService.mapBackendRouteToAngular(route);
    
  //   // // Only warn if the route is completely empty (not found and no default)
  //   // // Routes that return '/' are using the default fallback, which is acceptable
  //   // if (mappedRoute === '') {
  //   //   console.warn('Menu route mapping failed - empty result:', route);
  //   // }
    
  //   // return mappedRoute || '/'; // Return '/' as fallback if empty
  // }

  // handleMenuClick(event: Event, menu: MenuItem) {
  //   const route = this.getMenuRoute(menu.param4);
  //   if (route) {
  //     // Let Angular router handle navigation
  //     // Don't prevent default to allow normal routing
  //   }
  // }

  // routeCreate() {
  //   // TODO: Implement route creation
  //   
  // }

  navigateToRoute(route: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    if (route && route.trim() !== '') {
      // Remove leading slash if present (routerLink handles it)
      const cleanRoute = route.startsWith('/') ? route.substring(1) : route;
      
      this.router.navigate([cleanRoute]).catch(err => {
        console.error('Navigation error:', err);
        // Try with leading slash
        this.router.navigate(['/' + cleanRoute]).catch(err2 => {
          console.error('Navigation error with slash:', err2);
        });
      });
    }
  }

  // logout() {
  //   let request = {
  //     "param4":null,
  //     "param5":null,
  //     "param6":null,
  //     "param7":null,
  //     "param8":"Web",
  //     "param9":"Nc4kAGZg0hWhBD3l9wd8YA==:5eef15e4c3871d8af039b15e405bf07f4d8a80ac03347eef6386cfc85a36ac93e6082114bff898776fca554b63ba7f525f308a797b8d02d338af103eb87229d6:71rnPAM4PAM9DTZsjCBZAYWXJPdA=="
  //   }
  //  this.authService.logout(request).subscribe({
  //   next: () => {
  //     sessionStorage.clear(); // removes principalKey
  //     localStorage.clear();
  //     this.router.navigate(['/login']);
  //   },
  //   error: () => {
  //     sessionStorage.clear();
  //     localStorage.clear();
  //     this.router.navigate(['/login']);
  //   }
  // });
  // }



  logout() {
  let request = {
    "param4": null,
    "param5": null,
    "param6": null,
    "param7": null,
    "param8": "Web",
    "param9": "Nc4kAGZg0hWhBD3l9wd8YA==:5eef15e4c3871d8af039b15e405bf07f4d8a80ac03347eef6386cfc85a36ac93e6082114bff898776fca554b63ba7f525f308a797b8d02d338af103eb87229d6:71rnPAM4PAM9DTZsjCBZAYWXJPdA=="
  };

  this.authService.logout(request).subscribe({
    next: () => {
      this.clearAll();
      this.router.navigate(['/']);
    },
    error: () => {
      this.clearAll();
      this.router.navigate(['/']);
    }
  });
}

// 🔥 Common clear method
clearAll() {
  // Storage
  localStorage.clear();
  sessionStorage.clear();

  // Cookies (non-httpOnly)
sessionStorage.removeItem('authToken');
sessionStorage.removeItem('brbrowsername');
sessionStorage.removeItem('browserversion');
sessionStorage.removeItem('opersatingsys');
sessionStorage.removeItem('osversion');
}

// 🔥 Cookie delete helper
deleteCookie(name: string) {
 
  document.cookie = name + '=; Max-Age=0; path=/;';
  document.cookie = name + '=; Max-Age=0; path=/; domain=' + window.location.hostname + ';';
}
clickEvent(route: string) {
      
}
closeWarningModal(): void {
  this.modalCloseFlag = true;

  $('#deviceWarningModal').modal('hide');

  this.notsendingdevicedatacount();
}
modalCloseFlag: boolean = false;
notsendingdevicedatacount() {
  this.deviceService.notsendingdevicedatacount().subscribe({
    next: (response: any) => {
      if (response.statuscode==200) {
        this.deviceCount = Number(response.entity.details[0].count);
        const IntervalTime = response.entity.details[0].intervaltime;
        this.intervalTime = IntervalTime;
        if(!this.modalCloseFlag && this.deviceCount > 0) {
          $("#deviceWarningModal").modal('show');
        }
        this.modalCloseFlag = false;
      } else {
        this.deviceCount = 0;
        this.intervalTime = '';
      }
    },
    error: (error) => {
      console.error('Error fetching device count:', error);
    }
  });
}
}
