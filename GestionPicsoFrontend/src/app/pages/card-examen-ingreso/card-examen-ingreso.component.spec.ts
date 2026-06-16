import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardExamenIngresoComponent } from './card-examen-ingreso.component';

describe('CardExamenIngresoComponent', () => {
  let component: CardExamenIngresoComponent;
  let fixture: ComponentFixture<CardExamenIngresoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardExamenIngresoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardExamenIngresoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
