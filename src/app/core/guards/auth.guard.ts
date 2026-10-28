import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';

function checkAccess(stateUrl: string): boolean {

  const router = inject(Router);

  let currentUrl = stateUrl.replace(/^\/+/, '').split('?')[0];

  // login always allow
  if (currentUrl === 'login') {
    return true;
  }

  const principalKey = sessionStorage.getItem('principalKey');

  if (!principalKey) {
    router.navigateByUrl('/login');
    return false;
  }

  const allowedRoutes: string[] =
    JSON.parse(sessionStorage.getItem('allowedRoutes') || '[]');

  // remove parameters
  const baseRoute = currentUrl.split('/')[0];

  // check allowed list
  const isAllowed = allowedRoutes.some(route =>
    baseRoute.toLowerCase().includes(route.toLowerCase()) ||
    route.toLowerCase().includes(baseRoute.toLowerCase())
  );
if (!isAllowed) {

  // ✅ only allow these exact routes
  const allowedHardcodedRoutes = [
    'bulk-device-entry','vahan-pending','vahan-success','customer','displaypermitholder','PortEntry', 'healthcheck', 'acknowledgeactivation', 'ControlCenterDashboard'
  ];

  const isHardcodedAllowed = allowedHardcodedRoutes.includes(baseRoute);

  if (isHardcodedAllowed) {
    return true;
  }
// 🚫 Unauthorized access attempt dont commit it 
  console.warn('🚫 Unauthorized route blocked:', currentUrl);

  router.navigateByUrl('/unauthorized');
  return false;
}

  return true;
}

export const authGuard: CanActivateFn = (route, state) => {
  return checkAccess(state.url);
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  return checkAccess(state.url);
};