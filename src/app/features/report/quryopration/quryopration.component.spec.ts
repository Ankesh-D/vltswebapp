import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuryoprationComponent } from './quryopration.component';

describe('QuryoprationComponent', () => {
  let component: QuryoprationComponent;
  let fixture: ComponentFixture<QuryoprationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuryoprationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuryoprationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
