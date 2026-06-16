import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruebasHermeticidadDetalleComponent } from './pruebas-hermeticidad-detalle.component';

describe('PruebasHermeticidadDetalleComponent', () => {
  let component: PruebasHermeticidadDetalleComponent;
  let fixture: ComponentFixture<PruebasHermeticidadDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruebasHermeticidadDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PruebasHermeticidadDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
