import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendCommandDetailsComponent } from './send-command-details.component';

describe('SendCommandDetailsComponent', () => {
  let component: SendCommandDetailsComponent;
  let fixture: ComponentFixture<SendCommandDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendCommandDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SendCommandDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
