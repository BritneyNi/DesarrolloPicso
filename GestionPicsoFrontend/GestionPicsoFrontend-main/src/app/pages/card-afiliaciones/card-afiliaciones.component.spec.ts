import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAfiliacionesComponent } from './card-afiliaciones.component';

describe('CardAfiliacionesComponent', () => {
  let component: CardAfiliacionesComponent;
  let fixture: ComponentFixture<CardAfiliacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAfiliacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardAfiliacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
