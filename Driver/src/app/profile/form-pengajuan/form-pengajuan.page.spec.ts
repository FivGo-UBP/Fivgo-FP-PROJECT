import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPengajuanPage } from './form-pengajuan.page';

describe('FormPengajuanPage', () => {
  let component: FormPengajuanPage;
  let fixture: ComponentFixture<FormPengajuanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormPengajuanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
