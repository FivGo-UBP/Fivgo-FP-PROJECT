import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuLoginPage } from './menu-login.page';

describe('MenuLoginPage', () => {
  let component: MenuLoginPage;
  let fixture: ComponentFixture<MenuLoginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
