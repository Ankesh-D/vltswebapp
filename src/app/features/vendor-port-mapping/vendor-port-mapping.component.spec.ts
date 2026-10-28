import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorPortMappingComponent } from './vendor-port-mapping.component';

describe('VendorPortMappingComponent', () => {
  let component: VendorPortMappingComponent;
  let fixture: ComponentFixture<VendorPortMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorPortMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorPortMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
