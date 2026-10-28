import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';

import { filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { RouteMappingService } from './core/services/route-mapping.service';
import { ToastService } from './core/services/toast.service';
import { ToastComponent } from './features/assets/inactive-assets/toast.component';
@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToastComponent],
    template: `
    <div class="app-container">
      @if (toast) {
        <app-toast
          [message]="toast.message"
          [type]="toast.type"
          [duration]="toast.duration"
          (closed)="closeToast()">
        </app-toast>
      }

      <router-outlet></router-outlet>
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .app-container {
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'PSV Frontend';
  private router = inject(Router);
  private authService = inject(AuthService);
  private routeMappingService = inject(RouteMappingService);
  toast: any;
   constructor(private toastService: ToastService) {
    this.toastService.toast$.subscribe(t => this.toast = t);
  }

  ngOnInit() {
    // On app initialization, clear stale auth data if principalKey exists but is invalid
    // This prevents access to protected routes with stale localStorage data
    const principalKey = sessionStorage.getItem('principalKey');
    
    if (principalKey) {
      // If principalKey exists but isAuthenticated() returns false (missing authToken or sessionId),
      // clear all auth data to force re-login
      if (!this.authService.isAuthenticated()) {
        // //console.log('Clearing stale authentication data on app start');
        this.authService.clearAuth();
      }
    } else {
      // No principalKey - ensure all auth data is cleared
      this.authService.clearAuth();
    }
    
    // Monitor navigation to handle auth state and datepicker cleanup
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects;
      // //console.log('App Component - Navigation Event:', {
      //   url: event.url,
      //   urlAfterRedirects: url,
      //   routerState: this.router.routerState.snapshot
      // });
      
      // If authenticated and on login page, redirect to dashboard
      // if (url === '/login' && this.authService.isAuthenticated()) {
      //   let dashboardUrl = '/rtodashboard';
      //   const menuStr = sessionStorage.getItem('mainmenu');
      //   if (menuStr) {
      //     try {
      //       const menu = JSON.parse(menuStr);
      //       if (Array.isArray(menu) && menu.length > 0 && menu[0].param4 && menu[0].param4 !== '0') {
      //         dashboardUrl = this.routeMappingService.mapBackendRouteToAngular(menu[0].param4);
      //       }
      //     } catch (e) { }
      //   }
      //   if (!dashboardUrl.startsWith('/')) {
      //     dashboardUrl = '/' + dashboardUrl;
      //   }
      //   this.router.navigate([dashboardUrl], { replaceUrl: true });
      // }
      
      // Hide datepicker widgets when not on dashboard
      if (!url.includes('/dashboard') && typeof (window as any).jQuery !== 'undefined') {
        (window as any).jQuery('.datepicker').removeClass('dashboard-datepicker').hide();
        (window as any).jQuery('.datepicker-dropdown').removeClass('dashboard-datepicker').hide();
      }
    });
  }
   closeToast() {
    this.toastService.clear();
  }
}
