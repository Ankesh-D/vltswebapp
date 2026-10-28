import { HttpRequest } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NEVER } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BaseApiService } from '../services/base-api.service';
import { ToastService } from '../services/toast.service';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: BaseApiService, useValue: {} },
        {
          provide: AuthService,
          useValue: {
            getBrowserDetails: () => ({
              browsername: '',
              browserversion: '',
              opersatingsys: '',
              osversion: ''
            })
          }
        },
        { provide: ToastService, useValue: { pageName: '' } },
        { provide: Router, useValue: {} }
      ]
    });
    sessionStorage.clear();
  });

  it('fails requests that exceed the 30-second timeout', fakeAsync(() => {
    const onError = jasmine.createSpy('onError');
    const request = new HttpRequest('GET', '/timeout-test');

    TestBed.runInInjectionContext(() =>
      apiInterceptor(request, () => NEVER).subscribe({ error: onError })
    );

    tick(30000);

    expect(onError).toHaveBeenCalledWith(
      jasmine.objectContaining({ statusText: 'Request Timeout' })
    );
  }));
});
