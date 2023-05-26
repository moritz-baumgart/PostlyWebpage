import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoststatsComponent } from './poststats.component';

describe('PoststatsComponent', () => {
  let component: PoststatsComponent;
  let fixture: ComponentFixture<PoststatsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PoststatsComponent]
    });
    fixture = TestBed.createComponent(PoststatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
