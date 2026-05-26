import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PilihPenjemputanPage } from './pilih-penjemputan.page';

describe('PilihPenjemputanPage', () => {
  let component: PilihPenjemputanPage;
  let fixture: ComponentFixture<PilihPenjemputanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PilihPenjemputanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
