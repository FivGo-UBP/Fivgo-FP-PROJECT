import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpanLokasiPage } from './simpan-lokasi.page';

describe('SimpanLokasiPage', () => {
  let component: SimpanLokasiPage;
  let fixture: ComponentFixture<SimpanLokasiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpanLokasiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
