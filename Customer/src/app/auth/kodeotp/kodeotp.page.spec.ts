import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KodeotpPage } from './kodeotp.page';

describe('KodeotpPage', () => {
  let component: KodeotpPage;
  let fixture: ComponentFixture<KodeotpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KodeotpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
