import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorWiseDetailsClickOnChartComponent } from './vendor-wise-details-click-on-chart.component';

describe('VendorWiseDetailsClickOnChartComponent', () => {
  let component: VendorWiseDetailsClickOnChartComponent;
  let fixture: ComponentFixture<VendorWiseDetailsClickOnChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorWiseDetailsClickOnChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorWiseDetailsClickOnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
