import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KelolaProfilePage } from './kelola-profile.page';

describe('KelolaProfilePage', () => {
  let component: KelolaProfilePage;
  let fixture: ComponentFixture<KelolaProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(KelolaProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
