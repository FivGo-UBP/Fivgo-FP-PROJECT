import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlamatTersimpanPage } from './alamat-tersimpan.page';

describe('AlamatTersimpanPage', () => {
  let component: AlamatTersimpanPage;
  let fixture: ComponentFixture<AlamatTersimpanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlamatTersimpanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
