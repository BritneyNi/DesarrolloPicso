import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratistaComponent } from './contratista.component';

describe('ContratistaComponent', () => {
  let component: ContratistaComponent;
  let fixture: ComponentFixture<ContratistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
