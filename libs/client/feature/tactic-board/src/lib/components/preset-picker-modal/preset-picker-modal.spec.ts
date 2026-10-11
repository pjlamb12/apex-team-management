import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PresetPickerModal } from './preset-picker-modal';
import { ModalController } from '@ionic/angular/standalone';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PresetPickerModal', () => {
  let component: PresetPickerModal;
  let fixture: ComponentFixture<PresetPickerModal>;
  let mockModalCtrl: { dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockModalCtrl = {
      dismiss: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [PresetPickerModal],
      providers: [{ provide: ModalController, useValue: mockModalCtrl }],
    }).compileComponents();

    fixture = TestBed.createComponent(PresetPickerModal);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('sport', 'basketball');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return 7 basketball presets when sport is basketball', () => {
    fixture.componentRef.setInput('sport', 'basketball');
    fixture.detectChanges();

    const presets = component.presets;
    expect(presets.length).toBe(7);
    expect(presets.map((p) => p.id)).toEqual([
      'bb_5out_motion',
      'bb_4out_1in',
      'bb_23_zone',
      'bb_m2m_defense',
      'bb_horns_pnr',
      'bb_131_zone',
      'bb_blob_box',
    ]);
  });

  it('should filter basketball presets by category', () => {
    fixture.componentRef.setInput('sport', 'basketball');
    fixture.detectChanges();

    // Offensive presets
    component.activeCategory = 'offensive';
    const offensivePresets = component.presets;
    expect(offensivePresets.length).toBe(3);
    expect(offensivePresets.map((p) => p.id)).toEqual([
      'bb_5out_motion',
      'bb_4out_1in',
      'bb_horns_pnr',
    ]);

    // Defensive presets
    component.activeCategory = 'defensive';
    const defensivePresets = component.presets;
    expect(defensivePresets.length).toBe(3);
    expect(defensivePresets.map((p) => p.id)).toEqual([
      'bb_23_zone',
      'bb_m2m_defense',
      'bb_131_zone',
    ]);

    // Set piece (BLOB)
    component.activeCategory = 'set_piece';
    const setPiecePresets = component.presets;
    expect(setPiecePresets.length).toBe(1);
    expect(setPiecePresets[0].id).toBe('bb_blob_box');
  });

  it('should dismiss modal with preset on selection', () => {
    fixture.componentRef.setInput('sport', 'basketball');
    fixture.detectChanges();

    const preset = component.basketballPresets[0];
    component.selectPreset(preset);
    expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(preset, 'confirm');
  });

  it('should dismiss modal on cancel', () => {
    fixture.componentRef.setInput('sport', 'basketball');
    fixture.detectChanges();

    component.cancel();
    expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'cancel');
  });
});
