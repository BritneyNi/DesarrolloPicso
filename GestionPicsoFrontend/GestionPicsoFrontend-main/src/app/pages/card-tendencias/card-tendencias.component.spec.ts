import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTendenciasComponent } from './card-tendencias.component';

describe('CardTendenciasComponent', () => {
  let component: CardTendenciasComponent;
  let fixture: ComponentFixture<CardTendenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTendenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardTendenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
