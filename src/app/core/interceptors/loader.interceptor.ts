import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

// 🔥 Context token (NO CORS issue)
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

export const LoaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);

  // ✅ Skip loader if context is true
  if (req.context.get(SKIP_LOADER)) {
    return next(req);
  }

  // ✅ Show loader
  loader.show();

  return next(req).pipe(
    finalize(() => {
      loader.hide();
    })
  );
};