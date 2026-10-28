import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorStatusForNewVehiclesReportComponent } from './vendor-status-for-new-vehicles-report.component';

describe('VendorStatusForNewVehiclesReportComponent', () => {
  let component: VendorStatusForNewVehiclesReportComponent;
  let fixture: ComponentFixture<VendorStatusForNewVehiclesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorStatusForNewVehiclesReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorStatusForNewVehiclesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
