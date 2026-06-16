import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaTiemposComponent } from './lista-tiempos.component';

describe('ListaTiemposComponent', () => {
  let component: ListaTiemposComponent;
  let fixture: ComponentFixture<ListaTiemposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTiemposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaTiemposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
