import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardLiquidacionComponent } from './card-liquidacion.component';

describe('CardLiquidacionComponent', () => {
  let component: CardLiquidacionComponent;
  let fixture: ComponentFixture<CardLiquidacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardLiquidacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardLiquidacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
