import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrioritasKendaraanPage } from './prioritas-kendaraan.page';

describe('PrioritasKendaraanPage', () => {
  let component: PrioritasKendaraanPage;
  let fixture: ComponentFixture<PrioritasKendaraanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrioritasKendaraanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
