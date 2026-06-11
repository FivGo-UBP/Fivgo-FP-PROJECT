import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DaftarAktivitasPage } from './daftar-aktivitas.page';

describe('DaftarAktivitasPage', () => {
  let component: DaftarAktivitasPage;
  let fixture: ComponentFixture<DaftarAktivitasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DaftarAktivitasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
