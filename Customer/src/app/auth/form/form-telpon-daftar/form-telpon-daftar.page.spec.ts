import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormTelponDaftarPage } from './form-telpon-daftar.page';

describe('FormTelponDaftarPage', () => {
  let component: FormTelponDaftarPage;
  let fixture: ComponentFixture<FormTelponDaftarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormTelponDaftarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
