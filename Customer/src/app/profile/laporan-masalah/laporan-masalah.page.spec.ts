import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LaporanMasalahPage } from './laporan-masalah.page';

describe('LaporanMasalahPage', () => {
  let component: LaporanMasalahPage;
  let fixture: ComponentFixture<LaporanMasalahPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LaporanMasalahPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
