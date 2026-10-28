import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleClassWiseInstallationReportComponent } from './vehicle-class-wise-installation-report.component';

describe('VehicleClassWiseInstallationReportComponent', () => {
  let component: VehicleClassWiseInstallationReportComponent;
  let fixture: ComponentFixture<VehicleClassWiseInstallationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleClassWiseInstallationReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VehicleClassWiseInstallationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
