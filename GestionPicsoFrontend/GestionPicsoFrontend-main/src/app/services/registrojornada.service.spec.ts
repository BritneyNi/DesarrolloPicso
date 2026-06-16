import { TestBed } from '@angular/core/testing';

import { RegistroJornadaService } from './registrojornada.service';

describe('RegistrojornadaService', () => {
  let service: RegistroJornadaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroJornadaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
