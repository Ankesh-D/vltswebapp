import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { DeviceService } from '../../../core/services/device.service';
import { EncryptionService } from '../../../core/services/encryption.service';
import { ToastService } from '../../../core/services/toast.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { TotalNewDevicesComponent } from './total-new-devices.component';

describe('TotalNewDevicesComponent', () => {
  it('uses the Assets Details table classes and header color in the rendered DOM', async () => {
    const deviceService = jasmine.createSpyObj<DeviceService>('DeviceService', ['getDeviceDetailsByType']);
    deviceService.getDeviceDetailsByType.and.returnValue(of({
      status: true,
      statuscode: 200,
      entity: { listData: [], param1: 0 }
    }));

    await TestBed.configureTestingModule({
      imports: [TotalNewDevicesComponent],
      providers: [
        { provide: DeviceService, useValue: deviceService },
        { provide: VehicleService, useValue: jasmine.createSpyObj<VehicleService>('VehicleService', ['untagDevice']) },
        { provide: EncryptionService, useValue: jasmine.createSpyObj<EncryptionService>('EncryptionService', ['encryptAccountId']) },
        { provide: ToastService, useValue: jasmine.createSpyObj<ToastService>('ToastService', ['show', 'commonFileDownload']) },
        { provide: ActivatedRoute, useValue: { params: of({ filter: 'TotalDevice' }) } },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) }
      ]
    }).compileComponents();

    const fixture: ComponentFixture<TotalNewDevicesComponent> = TestBed.createComponent(TotalNewDevicesComponent);
    fixture.nativeElement.classList.add('app-shell');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const table: HTMLTableElement = fixture.nativeElement.querySelector('#devicetable');
    const dataTable: HTMLElement = fixture.nativeElement.querySelector('app-data-table');
    expect(table.classList.contains('table-sm')).toBeTrue();
    expect(getComputedStyle(dataTable).getPropertyValue('--app-table-header-bg').trim()).toBe('#245A96');
  });

  it('loads device-master details with its own API contract', () => {
    const deviceService = jasmine.createSpyObj<DeviceService>(
      'DeviceService',
      ['getDeviceDetailsByType', 'getAssetsDetails']
    );
    deviceService.getDeviceDetailsByType.and.returnValue(of({
      status: true,
      statuscode: 200,
      entity: { listData: [], param1: 0 }
    }));
    const route = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', [], {
      params: of({ filter: 'TotalDevice', vendor: 'vendor-id', rto: 'rto-id' })
    });

    const component = new TotalNewDevicesComponent(
      jasmine.createSpyObj<ToastService>('ToastService', ['show', 'commonFileDownload']),
      deviceService,
      jasmine.createSpyObj<VehicleService>('VehicleService', ['untagDevice']),
      jasmine.createSpyObj<EncryptionService>('EncryptionService', ['encryptAccountId']),
      route,
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges'])
    );

    component.ngOnInit();

    expect(deviceService.getDeviceDetailsByType).toHaveBeenCalledWith({
      param1: '',
      param2: '1',
      param3: '20',
      param8: 'vendor-id',
      param9: 'rto-id',
      param10: 'TotalDevice',
      pdfexcel: ''
    });
    expect(deviceService.getAssetsDetails).not.toHaveBeenCalled();

    component.onOldNewChange('old');
    expect(deviceService.getDeviceDetailsByType).toHaveBeenCalledWith({
      param1: '',
      param2: '1',
      param3: '20',
      param8: 'vendor-id',
      param9: 'rto-id',
      param10: 'TotalDevice',
      pdfexcel: ''
    });
  });
});
