import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceInOutReportComponent } from './geofence-in-out-report.component';

describe('GeofenceInOutReportComponent', () => {
  let component: GeofenceInOutReportComponent;
  let fixture: ComponentFixture<GeofenceInOutReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeofenceInOutReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeofenceInOutReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
