import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDotacionComponent } from './card-dotacion.component';

describe('CardDotacionComponent', () => {
  let component: CardDotacionComponent;
  let fixture: ComponentFixture<CardDotacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDotacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardDotacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
