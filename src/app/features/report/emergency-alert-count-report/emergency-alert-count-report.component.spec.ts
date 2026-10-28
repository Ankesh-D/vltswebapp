import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyAlertCountReportComponent } from './emergency-alert-count-report.component';

describe('EmergencyAlertCountReportComponent', () => {
  let component: EmergencyAlertCountReportComponent;
  let fixture: ComponentFixture<EmergencyAlertCountReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyAlertCountReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmergencyAlertCountReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
