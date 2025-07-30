import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IframepageComponent } from './iframepage.component';

describe('IframepageComponent', () => {
  let component: IframepageComponent;
  let fixture: ComponentFixture<IframepageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IframepageComponent]
    });
    fixture = TestBed.createComponent(IframepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
