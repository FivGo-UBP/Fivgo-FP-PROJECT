import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AktivasiLokasiPage } from './aktivasi-lokasi.page';

describe('AktivasiLokasiPage', () => {
  let component: AktivasiLokasiPage;
  let fixture: ComponentFixture<AktivasiLokasiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AktivasiLokasiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
