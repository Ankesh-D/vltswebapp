import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteDeviationReportComponent } from './route-deviation-report.component';

describe('RouteDeviationReportComponent', () => {
  let component: RouteDeviationReportComponent;
  let fixture: ComponentFixture<RouteDeviationReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteDeviationReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RouteDeviationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
