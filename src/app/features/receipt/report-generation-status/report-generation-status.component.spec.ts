import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { GetStatusService } from '../../../core/services/get-status.service';
import { MapboxService } from '../../../core/services/mapbox.service';
import { VehicleService } from '../../../core/services/vehicle.service';

import { ReportGenerationStatusComponent } from './report-generation-status.component';

describe('ReportGenerationStatusComponent', () => {
  let component: ReportGenerationStatusComponent;
  let fixture: ComponentFixture<ReportGenerationStatusComponent>;
  let getStatusServiceMock: jasmine.SpyObj<GetStatusService>;
  let mapboxServiceMock: { noTrackData$: Subject<string> };
  let vehicleServiceMock: jasmine.SpyObj<VehicleService>;

  beforeEach(async () => {
    getStatusServiceMock = jasmine.createSpyObj('GetStatusService', ['getStatusDetails']);
    vehicleServiceMock = jasmine.createSpyObj('VehicleService', ['updateVehicleActivationStatus', 'getVehicleDetailsByType']);
    mapboxServiceMock = {
      noTrackData$: new Subject<string>()
    };

    // Mock the call made in ngOnInit
    vehicleServiceMock.getVehicleDetailsByType.and.returnValue(of({ status: true, statuscode: 200, entity: { listData: [] } } as any));

    await TestBed.configureTestingModule({
      imports: [ReportGenerationStatusComponent],
      providers: [
        { provide: GetStatusService, useValue: getStatusServiceMock },
        { provide: MapboxService, useValue: mapboxServiceMock },
        { provide: VehicleService, useValue: vehicleServiceMock }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportGenerationStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getStatusOnInitDetails on init and fetch vehicle details', () => {
    expect(vehicleServiceMock.getVehicleDetailsByType).toHaveBeenCalledTimes(1);
  });

  it('should sort data when sort is called', () => {
    component.vehicleDetails = [{ param12: 'B' }, { param12: 'A' }];
    component.sort('param12');
    expect(component.vehicleDetails[0].param12).toBe('A');
  });
});
