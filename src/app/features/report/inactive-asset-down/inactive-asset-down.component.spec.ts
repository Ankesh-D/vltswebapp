import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InactiveAssetDownComponent } from './inactive-asset-down.component';

describe('InactiveAssetDownComponent', () => {
  let component: InactiveAssetDownComponent;
  let fixture: ComponentFixture<InactiveAssetDownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactiveAssetDownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InactiveAssetDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
