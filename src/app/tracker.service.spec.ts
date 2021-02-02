import { TestBed } from '@angular/core/testing';

import { TrackerService } from './tracker.service';

describe('TrackerService', () => {
  let service: TrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
