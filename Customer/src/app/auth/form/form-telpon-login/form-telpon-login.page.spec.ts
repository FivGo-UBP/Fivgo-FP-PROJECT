import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormTelponLoginPage } from './form-telpon-login.page';

describe('FormTelponLoginPage', () => {
  let component: FormTelponLoginPage;
  let fixture: ComponentFixture<FormTelponLoginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormTelponLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
