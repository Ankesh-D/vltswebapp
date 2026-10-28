import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenevalActivationComponent } from './reneval-activation.component';

describe('RenevalActivationComponent', () => {
  let component: RenevalActivationComponent;
  let fixture: ComponentFixture<RenevalActivationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenevalActivationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenevalActivationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
