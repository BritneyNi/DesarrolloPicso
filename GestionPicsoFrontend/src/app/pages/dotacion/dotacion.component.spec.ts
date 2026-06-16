import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DotacionComponent } from './dotacion.component';

describe('DotacionComponent', () => {
  let component: DotacionComponent;
  let fixture: ComponentFixture<DotacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DotacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DotacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
