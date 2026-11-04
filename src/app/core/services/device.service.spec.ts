import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DeviceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the exact device-master payload without a type parameter', () => {
    service.getDeviceDetailsByType({
      param1: '',
      param2: '1',
      param3: '20',
      param8: '',
      param9: '',
      param10: 'TotalDevice',
      pdfexcel: ''
    }).subscribe();

    const request = http.expectOne('/psv_get_device_master_details');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      param1: '',
      param2: '1',
      param3: '20',
      param8: '',
      param9: '',
      param10: 'TotalDevice',
      pdfexcel: '',
      pagename: 'Device Master Details'
    });
    request.flush({ status: true, statuscode: 200, entity: { listData: [], param1: 0 } });
  });
});
