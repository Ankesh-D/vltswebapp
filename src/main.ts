
import { bootstrapApplication } from '@angular/platform-browser';
import 'ux4g-web-components/design-system';
import { importProvidersFrom } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/core/interceptors/api.interceptor';
import { LoaderInterceptor } from './app/core/interceptors/loader.interceptor';

import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { PlusOutline } from '@ant-design/icons-angular/icons';

// ================= CHUNK RELOAD CONFIG =================

const CHUNK_RELOAD_KEY = 'psvChunkReloadAttempts';
const MAX_CHUNK_RELOAD_ATTEMPTS = 5;
const RELOAD_DELAY_MS = 1000;

const CHUNK_LOAD_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError|error loading dynamically imported module|Failed to load module script/i;

let reloadScheduled = false;

// ================= CHUNK FAILURE HANDLER =================

function getAttemptCount(): number {
  try {
    return Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
  } catch {
    return MAX_CHUNK_RELOAD_ATTEMPTS;
  }
}

function handleChunkLoadFailure(): void {
  if (reloadScheduled) {
    return;
  }

  const attempts = getAttemptCount();

  if (attempts >= MAX_CHUNK_RELOAD_ATTEMPTS) {
    return;
  }

  const nextAttempt = attempts + 1;

  try {
    sessionStorage.setItem(
      CHUNK_RELOAD_KEY,
      String(nextAttempt)
    );
  } catch {
    // Do not reload if retry tracking is unavailable.
    return;
  }

  reloadScheduled = true;

  window.setTimeout(() => {
    window.location.reload();
  }, RELOAD_DELAY_MS);
}

// ================= GLOBAL ERROR LISTENERS =================

// Handle JavaScript errors and failed script/resource loads.
window.addEventListener(
  'error',
  (event: Event) => {
    const errorEvent = event as ErrorEvent;
    const target = event.target;

    const message = errorEvent.message || '';

    const errorText =
      errorEvent.error instanceof Error
        ? `${errorEvent.error.name}: ${errorEvent.error.message}`
        : '';

    const failedUrl =
      target instanceof HTMLScriptElement
        ? target.src
        : target instanceof HTMLLinkElement
          ? target.href
          : '';

    const isJavaScriptResource =
      /\.(?:m?js)(?:[?#].*)?$/i.test(failedUrl);

    if (
      CHUNK_LOAD_ERROR_RE.test(message) ||
      CHUNK_LOAD_ERROR_RE.test(errorText) ||
      isJavaScriptResource
    ) {
      handleChunkLoadFailure();
    }
  },
  true
);

// Handle dynamic import failures.
window.addEventListener(
  'unhandledrejection',
  (event: PromiseRejectionEvent) => {
    const reason =
      event.reason instanceof Error
        ? `${event.reason.name}: ${event.reason.message}`
        : String(event.reason ?? '');

    if (CHUNK_LOAD_ERROR_RE.test(reason)) {
      handleChunkLoadFailure();
    }
  }
);

// ================= APPLICATION BOOTSTRAP =================

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([apiInterceptor, LoaderInterceptor])
    ),
    provideAnimations(),
    provideRouter(routes, withHashLocation()),
    importProvidersFrom(NgxDaterangepickerMd.forRoot()),
    {
      provide: NZ_ICONS,
      useValue: [PlusOutline]
    }
  ]
}).catch(() => {
  // Bootstrap failure is intentionally silent.
});
