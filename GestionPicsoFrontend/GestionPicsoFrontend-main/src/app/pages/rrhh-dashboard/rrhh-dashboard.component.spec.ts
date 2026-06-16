import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrhhDashboardComponent } from './rrhh-dashboard.component';

describe('RrhhDashboardComponent', () => {
  let component: RrhhDashboardComponent;
  let fixture: ComponentFixture<RrhhDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrhhDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrhhDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
