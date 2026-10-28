import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestAlertComponent } from './rest-alert.component';

describe('RestAlertComponent', () => {
  let component: RestAlertComponent;
  let fixture: ComponentFixture<RestAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RestAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
