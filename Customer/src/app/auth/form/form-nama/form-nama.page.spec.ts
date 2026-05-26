import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormNamaPage } from './form-nama.page';

describe('FormNamaPage', () => {
  let component: FormNamaPage;
  let fixture: ComponentFixture<FormNamaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormNamaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
