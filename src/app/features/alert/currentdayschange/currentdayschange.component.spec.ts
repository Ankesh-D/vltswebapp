import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentdayschangeComponent } from './currentdayschange.component';

describe('CurrentdayschangeComponent', () => {
  let component: CurrentdayschangeComponent;
  let fixture: ComponentFixture<CurrentdayschangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentdayschangeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurrentdayschangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
