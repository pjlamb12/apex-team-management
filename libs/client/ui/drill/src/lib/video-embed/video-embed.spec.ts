import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoEmbed } from './video-embed';
import { DomSanitizer } from '@angular/platform-browser';

describe('VideoEmbed', () => {
  let component: VideoEmbed;
  let fixture: ComponentFixture<VideoEmbed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoEmbed],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoEmbed);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify youtube videos', () => {
    fixture.componentRef.setInput('sourceUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    fixture.detectChanges();
    
    // @ts-ignore
    expect(component.videoType()).toBe('youtube');
    // @ts-ignore
    expect(component.youtubeId()).toBe('dQw4w9WgXcQ');
  });

  it('should identify vimeo videos', () => {
    fixture.componentRef.setInput('sourceUrl', 'https://vimeo.com/123456789');
    fixture.detectChanges();
    
    // @ts-ignore
    expect(component.videoType()).toBe('vimeo');
    // @ts-ignore
    expect(component.vimeoId()).toBe('123456789');
  });

  it('should handle other videos with sanitization', () => {
    fixture.componentRef.setInput('sourceUrl', 'https://example.com/video.mp4');
    fixture.detectChanges();
    
    // @ts-ignore
    expect(component.videoType()).toBe('other');
    // @ts-ignore
    expect(component.safeUrl()).toBeTruthy();
  });

  it('should handle empty sourceUrl', () => {
    fixture.componentRef.setInput('sourceUrl', undefined);
    fixture.detectChanges();
    
    // @ts-ignore
    expect(component.videoType()).toBeUndefined();
    // @ts-ignore
    expect(component.youtubeId()).toBeUndefined();
    // @ts-ignore
    expect(component.safeUrl()).toBeUndefined();
  });
});
