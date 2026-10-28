import { TestBed } from '@angular/core/testing';

import { SchoolManagementService } from './school-management.service';

describe('SchoolManagementService', () => {
  let service: SchoolManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchoolManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
