import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAlturasComponent } from './card-alturas.component';

describe('CardAlturasComponent', () => {
  let component: CardAlturasComponent;
  let fixture: ComponentFixture<CardAlturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAlturasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardAlturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
