import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruebasHermetricidadComponent } from './pruebas-hermeticidad.component';

describe('PruebasHermetricidadComponent', () => {
  let component: PruebasHermetricidadComponent;
  let fixture: ComponentFixture<PruebasHermetricidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruebasHermetricidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PruebasHermetricidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
