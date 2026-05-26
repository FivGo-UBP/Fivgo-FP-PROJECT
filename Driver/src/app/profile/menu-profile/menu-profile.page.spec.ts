import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuProfilePage } from './menu-profile.page';

describe('MenuProfilePage', () => {
  let component: MenuProfilePage;
  let fixture: ComponentFixture<MenuProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
