import {
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubePlayer } from '@angular/youtube-player';

@Component({
  selector: 'app-video-embed',
  standalone: true,
  imports: [CommonModule, YouTubePlayer],
  template: `
    <div class="video-container relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-black">
      @if (videoType() === 'youtube' && youtubeId()) {
        <div class="absolute top-0 left-0 w-full h-full">
          <youtube-player
            [videoId]="youtubeId()!"
            [width]="undefined"
            [height]="undefined"
            class="w-full h-full"
          />
        </div>
      } @else if (videoType() === 'vimeo' && safeUrl()) {
        <iframe
          [src]="safeUrl()!"
          class="absolute top-0 left-0 w-full h-full"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      } @else if (safeUrl()) {
        <iframe
          [src]="safeUrl()!"
          class="absolute top-0 left-0 w-full h-full"
          frameborder="0"
          allowfullscreen
        ></iframe>
      } @else {
        <div class="absolute inset-0 flex items-center justify-center text-gray-400">
          <p>No video source available</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      ::ng-deep youtube-player iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
})
export class VideoEmbed implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);

  sourceUrl = input<string | undefined>();

  protected videoType = computed<'youtube' | 'vimeo' | 'other' | undefined>(() => {
    const url = this.sourceUrl();
    if (!url) return undefined;

    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'other';
  });

  protected youtubeId = computed<string | undefined>(() => {
    const url = this.sourceUrl();
    if (!url || this.videoType() !== 'youtube') return undefined;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : undefined;
  });

  protected vimeoId = computed<string | undefined>(() => {
    const url = this.sourceUrl();
    if (!url || this.videoType() !== 'vimeo') return undefined;

    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);

    return match ? match[1] : undefined;
  });

  protected safeUrl = computed<SafeResourceUrl | undefined>(() => {
    const url = this.sourceUrl();
    if (!url) return undefined;

    const type = this.videoType();
    if (type === 'vimeo' && this.vimeoId()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${this.vimeoId()}`
      );
    }

    if (type === 'other') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    return undefined;
  });

  private static apiLoaded = false;

  ngOnInit() {
    if (!VideoEmbed.apiLoaded && this.videoType() === 'youtube') {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      VideoEmbed.apiLoaded = true;
    }
  }
}
