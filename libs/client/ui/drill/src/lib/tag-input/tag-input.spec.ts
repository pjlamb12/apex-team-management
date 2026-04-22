import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagInput } from './tag-input';
import { Tag } from '@apex-team/client/data-access/drill';

describe('TagInput', () => {
  let component: TagInput;
  let fixture: ComponentFixture<TagInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagInput],
    }).compileComponents();

    fixture = TestBed.createComponent(TagInput);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit updated tags when removing a tag', () => {
    const tags: Tag[] = [
      { id: '1', name: 'tag1', coachId: 'c1' },
      { id: '2', name: 'tag2', coachId: 'c1' },
    ];
    fixture.componentRef.setInput('selectedTags', tags);
    fixture.detectChanges();

    let emitted: Tag[] | undefined;
    component.tagsChanged.subscribe(t => emitted = t);

    // @ts-ignore
    component.removeTag(tags[0]);

    expect(emitted).toHaveLength(1);
    expect(emitted![0].id).toBe('2');
  });

  it('should emit updated tags when adding a tag', () => {
    const tags: Tag[] = [{ id: '1', name: 'tag1', coachId: 'c1' }];
    fixture.componentRef.setInput('selectedTags', tags);
    fixture.componentRef.setInput('availableTags', [
      { id: '2', name: 'tag2', coachId: 'c1' },
    ]);
    fixture.detectChanges();

    let emitted: Tag[] | undefined;
    component.tagsChanged.subscribe(t => emitted = t);

    // Set input value
    // @ts-ignore
    component.inputValue.set('tag2');
    
    // @ts-ignore
    component.handleAddTag({});

    expect(emitted).toHaveLength(2);
    expect(emitted![1].name).toBe('tag2');
    expect(emitted![1].id).toBe('2');
  });
});
