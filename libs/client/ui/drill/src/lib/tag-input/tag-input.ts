import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonChip,
  IonLabel,
  IonIcon,
  IonInput,
  IonList,
  IonItem,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { Tag } from '@apex-team/client/data-access/drill';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, IonChip, IonLabel, IonIcon, IonInput, IonList, IonItem],
  templateUrl: './tag-input.html',
  styleUrl: './tag-input.scss',
})
export class TagInput {
  // Inputs
  selectedTags = input<Tag[]>([]);
  availableTags = input<Tag[]>([]);

  // Outputs
  tagsChanged = output<Tag[]>();

  // State
  protected inputValue = signal('');
  protected isFocused = signal(false);

  // Filtered available tags that are not yet selected
  protected suggestions = computed(() => {
    const query = this.inputValue().toLowerCase().trim();
    const selected = this.selectedTags();
    const available = this.availableTags();

    return available.filter(tag => {
      // Exclude if already selected
      const isAlreadySelected = selected.some(t => t.name.toLowerCase() === tag.name.toLowerCase() || (t.id && t.id === tag.id));
      if (isAlreadySelected) return false;

      // Filter by query if query is typed
      if (query) {
        return tag.name.toLowerCase().includes(query);
      }
      
      // If no query, show all available, unselected tags
      return true;
    });
  });

  constructor() {
    addIcons({ closeCircle });
  }

  protected removeTag(tagToRemove: Tag) {
    const currentTags = this.selectedTags();
    const updatedTags = currentTags.filter(t => (t.id && t.id !== tagToRemove.id) || (t.name !== tagToRemove.name));
    this.tagsChanged.emit(updatedTags);
  }

  protected handleAddTag(event: any) {
    const name = this.inputValue().trim();
    if (!name) return;

    const currentTags = this.selectedTags();
    const alreadySelected = currentTags.some(t => t.name.toLowerCase() === name.toLowerCase());

    if (!alreadySelected) {
      const existingTag = this.availableTags().find(t => t.name.toLowerCase() === name.toLowerCase());
      const newTag: Tag = existingTag || { id: '', coachId: '', name };
      this.tagsChanged.emit([...currentTags, newTag]);
    }

    this.inputValue.set('');
  }

  protected selectSuggestion(tag: Tag) {
    const currentTags = this.selectedTags();
    const alreadySelected = currentTags.some(t => t.name.toLowerCase() === tag.name.toLowerCase() || (t.id && t.id === tag.id));

    if (!alreadySelected) {
      this.tagsChanged.emit([...currentTags, tag]);
    }
    this.inputValue.set('');
  }

  protected handleBlur() {
    // Small timeout to allow click event on suggestion to process first
    setTimeout(() => {
      this.isFocused.set(false);
    }, 200);
  }
}
