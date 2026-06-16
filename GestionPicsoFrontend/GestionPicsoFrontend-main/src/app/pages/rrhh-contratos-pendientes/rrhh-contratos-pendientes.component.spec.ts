import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhContratosPendientesComponent } from './rrhh-contratos-pendientes.component';

describe('RrhhContratosPendientesComponent', () => {
  let component: RrhhContratosPendientesComponent;
  let fixture: ComponentFixture<RrhhContratosPendientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhContratosPendientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhContratosPendientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
