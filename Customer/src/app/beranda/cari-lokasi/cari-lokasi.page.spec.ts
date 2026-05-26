import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CariLokasiPage } from './cari-lokasi.page';

describe('CariLokasiPage', () => {
  let component: CariLokasiPage;
  let fixture: ComponentFixture<CariLokasiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CariLokasiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
