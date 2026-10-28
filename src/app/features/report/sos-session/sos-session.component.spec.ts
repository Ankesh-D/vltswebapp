import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SosSessionComponent } from './sos-session.component';

describe('SosSessionComponent', () => {
  let component: SosSessionComponent;
  let fixture: ComponentFixture<SosSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SosSessionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SosSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
