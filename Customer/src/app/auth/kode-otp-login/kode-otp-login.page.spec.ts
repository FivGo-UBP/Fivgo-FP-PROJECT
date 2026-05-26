import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KodeOtpLoginPage } from './kode-otp-login.page';

describe('KodeOtpLoginPage', () => {
  let component: KodeOtpLoginPage;
  let fixture: ComponentFixture<KodeOtpLoginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KodeOtpLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
