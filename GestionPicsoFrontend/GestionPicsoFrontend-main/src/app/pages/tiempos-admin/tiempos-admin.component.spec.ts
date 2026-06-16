import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiemposAdminComponent } from './tiempos-admin.component';

describe('TiemposAdminComponent', () => {
  let component: TiemposAdminComponent;
  let fixture: ComponentFixture<TiemposAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiemposAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiemposAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
