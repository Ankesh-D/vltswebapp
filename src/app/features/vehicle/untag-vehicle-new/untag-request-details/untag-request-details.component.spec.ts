import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UntagRequestDetailsComponent } from './untag-request-details.component';

describe('UntagRequestDetailsComponent', () => {
  let component: UntagRequestDetailsComponent;
  let fixture: ComponentFixture<UntagRequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UntagRequestDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UntagRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
