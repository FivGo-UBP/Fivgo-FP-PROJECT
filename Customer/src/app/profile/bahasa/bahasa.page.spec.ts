import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BahasaPage } from './bahasa.page';

describe('BahasaPage', () => {
  let component: BahasaPage;
  let fixture: ComponentFixture<BahasaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BahasaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
