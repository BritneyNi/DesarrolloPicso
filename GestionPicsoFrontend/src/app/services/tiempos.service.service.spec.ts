import { TestBed } from '@angular/core/testing';
import { TiemposService } from './tiempos.service.service';

describe('TiemposServiceService', () => {
  let service: TiemposService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiemposService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
