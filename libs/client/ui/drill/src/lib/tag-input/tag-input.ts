import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonChip,
  IonLabel,
  IonIcon,
  IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { Tag } from '@apex-team/client/data-access/drill';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, IonChip, IonLabel, IonIcon, IonInput],
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

  constructor() {
    addIcons({ closeCircle });
  }

  protected removeTag(tagToRemove: Tag) {
    const currentTags = this.selectedTags();
    const updatedTags = currentTags.filter(t => (t.id && t.id !== tagToRemove.id) || (t.name !== tagToRemove.name));
    this.tagsChanged.emit(updatedTags);
  }

  protected handleAddTag(event: any) {
    // event is a KeyboardEvent from ion-input
    const name = this.inputValue().trim();
    if (!name) return;

    const currentTags = this.selectedTags();
    const alreadySelected = currentTags.some(t => t.name.toLowerCase() === name.toLowerCase());

    if (!alreadySelected) {
      // Find in available tags or create new partial tag
      const existingTag = this.availableTags().find(t => t.name.toLowerCase() === name.toLowerCase());
      const newTag: Tag = existingTag || { id: '', coachId: '', name };
      this.tagsChanged.emit([...currentTags, newTag]);
    }

    this.inputValue.set('');
  }
}
