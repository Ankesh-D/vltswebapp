import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclewiseoverspeedreportComponent } from './vehiclewiseoverspeedreport.component';

describe('VehiclewiseoverspeedreportComponent', () => {
  let component: VehiclewiseoverspeedreportComponent;
  let fixture: ComponentFixture<VehiclewiseoverspeedreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiclewiseoverspeedreportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VehiclewiseoverspeedreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
