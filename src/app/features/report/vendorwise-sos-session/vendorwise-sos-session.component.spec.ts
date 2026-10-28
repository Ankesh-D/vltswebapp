import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorwiseSosSessionComponent } from './vendorwise-sos-session.component';

describe('VendorwiseSosSessionComponent', () => {
  let component: VendorwiseSosSessionComponent;
  let fixture: ComponentFixture<VendorwiseSosSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorwiseSosSessionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorwiseSosSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
