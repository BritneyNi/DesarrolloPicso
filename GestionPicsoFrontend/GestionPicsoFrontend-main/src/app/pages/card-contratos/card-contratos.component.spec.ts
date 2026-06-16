import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardContratosComponent } from './card-contratos.component';

describe('CardContratosComponent', () => {
  let component: CardContratosComponent;
  let fixture: ComponentFixture<CardContratosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardContratosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardContratosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
