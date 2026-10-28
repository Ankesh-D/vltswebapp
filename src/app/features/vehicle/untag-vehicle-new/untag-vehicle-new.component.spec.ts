import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UntagVehicleNewComponent } from './untag-vehicle-new.component';

describe('UntagVehicleNewComponent', () => {
  let component: UntagVehicleNewComponent;
  let fixture: ComponentFixture<UntagVehicleNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UntagVehicleNewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UntagVehicleNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
