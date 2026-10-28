import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDeviceCountComponent } from './new-device-count.component';

describe('NewDeviceCountComponent', () => {
  let component: NewDeviceCountComponent;
  let fixture: ComponentFixture<NewDeviceCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDeviceCountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewDeviceCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
