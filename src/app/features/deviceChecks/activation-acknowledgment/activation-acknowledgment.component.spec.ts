import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivationAcknowledgmentComponent } from './activation-acknowledgment.component';

describe('ActivationAcknowledgmentComponent', () => {
  let component: ActivationAcknowledgmentComponent;
  let fixture: ComponentFixture<ActivationAcknowledgmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivationAcknowledgmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActivationAcknowledgmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
