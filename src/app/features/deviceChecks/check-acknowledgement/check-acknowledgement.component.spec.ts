import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckAcknowledgementComponent } from './check-acknowledgement.component';

describe('CheckAcknowledgementComponent', () => {
  let component: CheckAcknowledgementComponent;
  let fixture: ComponentFixture<CheckAcknowledgementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckAcknowledgementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckAcknowledgementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
