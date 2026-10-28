import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertGraphViewComponent } from './alert-graph-view.component';

describe('AlertGraphViewComponent', () => {
  let component: AlertGraphViewComponent;
  let fixture: ComponentFixture<AlertGraphViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertGraphViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlertGraphViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
