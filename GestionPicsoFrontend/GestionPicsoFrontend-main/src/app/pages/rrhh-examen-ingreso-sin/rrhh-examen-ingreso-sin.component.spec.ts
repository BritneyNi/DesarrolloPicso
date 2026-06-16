import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhExamenIngresoSinComponent } from './rrhh-examen-ingreso-sin.component';

describe('RrhhExamenIngresoSinComponent', () => {
  let component: RrhhExamenIngresoSinComponent;
  let fixture: ComponentFixture<RrhhExamenIngresoSinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhExamenIngresoSinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhExamenIngresoSinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
