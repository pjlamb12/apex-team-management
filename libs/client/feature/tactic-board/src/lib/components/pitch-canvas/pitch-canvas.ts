import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  colorPaletteOutline,
  swapHorizontalOutline,
  closeOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import {
  TacticToken,
  TacticDrawing,
  DrawingToolType,
  PitchType,
  TacticSport,
  TokenType,
} from '@apex-team/shared/util/models';

@Component({
  selector: 'app-pitch-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
  ],
  templateUrl: './pitch-canvas.html',
  styleUrl: './pitch-canvas.scss',
})
export class PitchCanvas {
  @Input({ required: true }) sport: TacticSport = 'soccer';
  @Input() pitchType: PitchType = 'full_pitch';
  @Input() tokens: TacticToken[] = [];
  @Input() drawings: TacticDrawing[] = [];
  @Input() activeTool: 'select' | DrawingToolType | 'eraser' = 'select';
  @Input() activeColor = '#facc15';
  @Input() strokeWidth = 3;
  @Input() isInteractive = true;
  @Input() isPlaying = false;

  @Output() tokensChange = new EventEmitter<TacticToken[]>();
  @Output() drawingsChange = new EventEmitter<TacticDrawing[]>();
  @Output() tokenSelect = new EventEmitter<TacticToken | null>();

  readonly boardContainer = viewChild<ElementRef<HTMLDivElement>>('boardContainer');

  // Active interaction states
  readonly draggingTokenId = signal<string | null>(null);
  readonly selectedToken = signal<TacticToken | null>(null);
  readonly isDrawing = signal<boolean>(false);
  readonly currentDrawingPoints = signal<{ x: number; y: number }[]>([]);

  // Token edit popover
  readonly editingToken = signal<TacticToken | null>(null);
  editLabel = '';
  editRole = '';
  editTeam: TokenType = 'home';

  // Pointer & Long-press tracking
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  private pointerStartPos = { x: 0, y: 0 };
  private hasMovedWhileDown = false;

  constructor() {
    addIcons({
      createOutline,
      trashOutline,
      colorPaletteOutline,
      swapHorizontalOutline,
      closeOutline,
      checkmarkOutline,
    });
  }

  // Token dragging & pointer handling
  onTokenPointerDown(event: PointerEvent, token: TacticToken): void {
    if (!this.isInteractive || this.activeTool !== 'select') return;
    event.stopPropagation();

    this.pointerStartPos = { x: event.clientX, y: event.clientY };
    this.hasMovedWhileDown = false;
    this.draggingTokenId.set(token.id);
    this.selectedToken.set(token);
    this.tokenSelect.emit(token);

    // Click & Hold (Long-press ~450ms) to open edit modal
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
    }
    this.longPressTimeout = setTimeout(() => {
      if (!this.hasMovedWhileDown) {
        this.openEditToken(token);
      }
    }, 450);

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onTokenPointerMove(event: PointerEvent, token: TacticToken): void {
    if (this.draggingTokenId() !== token.id) return;
    event.stopPropagation();

    // If movement exceeds threshold, cancel click-and-hold
    const dist = Math.hypot(event.clientX - this.pointerStartPos.x, event.clientY - this.pointerStartPos.y);
    if (dist > 4) {
      this.hasMovedWhileDown = true;
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }
    }

    const container = this.boardContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((event.clientY - rect.top) / rect.height) * 100));

    const updated = this.tokens.map((t) =>
      t.id === token.id ? { ...t, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : t
    );
    this.tokens = updated;
    this.tokensChange.emit(updated);
  }

  onTokenPointerUp(event: PointerEvent, token: TacticToken): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    if (this.draggingTokenId() === token.id) {
      this.draggingTokenId.set(null);
      try {
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        // ignore if not captured
      }
    }
  }

  onTokenClick(event: MouseEvent, token: TacticToken): void {
    if (!this.isInteractive) return;
    event.stopPropagation();

    if (this.activeTool === 'eraser') {
      this.deleteToken(token.id);
      return;
    }

    // Single click only selects the token, does NOT open modal
    if (this.activeTool === 'select') {
      this.selectedToken.set(token);
      this.tokenSelect.emit(token);
    }
  }

  onTokenDblClick(event: MouseEvent, token: TacticToken): void {
    if (!this.isInteractive || this.activeTool !== 'select') return;
    event.stopPropagation();
    event.preventDefault();
    this.openEditToken(token);
  }

  onTokenContextMenu(event: MouseEvent, token: TacticToken): void {
    if (!this.isInteractive || this.activeTool !== 'select') return;
    event.stopPropagation();
    event.preventDefault();
    this.openEditToken(token);
  }

  openEditToken(token: TacticToken): void {
    this.editingToken.set(token);
    this.editLabel = token.label;
    this.editRole = token.role || '';
    this.editTeam = token.team;
  }

  saveTokenEdit(): void {
    const token = this.editingToken();
    if (!token) return;

    const updated = this.tokens.map((t) =>
      t.id === token.id
        ? {
            ...t,
            label: this.editLabel.trim(),
            role: this.editRole.trim() || undefined,
            team: this.editTeam,
          }
        : t
    );
    this.tokens = updated;
    this.tokensChange.emit(updated);
    this.editingToken.set(null);
  }

  deleteToken(tokenId: string): void {
    const updated = this.tokens.filter((t) => t.id !== tokenId);
    this.tokens = updated;
    this.tokensChange.emit(updated);
    if (this.selectedToken()?.id === tokenId) {
      this.selectedToken.set(null);
      this.tokenSelect.emit(null);
    }
    this.editingToken.set(null);
  }

  // Board background canvas drawing
  onBoardPointerDown(event: PointerEvent): void {
    if (!this.isInteractive || this.activeTool === 'select' || this.activeTool === 'eraser') return;
    event.preventDefault();

    const container = this.boardContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

    this.isDrawing.set(true);
    this.currentDrawingPoints.set([{ x, y }]);
    container.setPointerCapture(event.pointerId);
  }

  onBoardPointerMove(event: PointerEvent): void {
    if (!this.isDrawing()) return;
    event.preventDefault();

    const container = this.boardContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

    const points = this.currentDrawingPoints();
    if (this.activeTool === 'freehand') {
      this.currentDrawingPoints.set([...points, { x, y }]);
    } else {
      // Shape / Arrow: update target endpoint
      this.currentDrawingPoints.set([points[0], { x, y }]);
    }
  }

  onBoardPointerUp(event: PointerEvent): void {
    if (!this.isDrawing()) return;
    this.isDrawing.set(false);

    const container = this.boardContainer()?.nativeElement;
    if (container) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    const points = this.currentDrawingPoints();
    if (points.length >= 2 || (this.activeTool === 'freehand' && points.length > 0)) {
      const newDrawing: TacticDrawing = {
        id: 'draw-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        tool: this.activeTool as DrawingToolType,
        points: [...points],
        color: this.activeColor,
        width: this.strokeWidth,
      };
      const updated = [...this.drawings, newDrawing];
      this.drawings = updated;
      this.drawingsChange.emit(updated);
    }
    this.currentDrawingPoints.set([]);
  }

  onDrawingClick(event: MouseEvent, drawingId: string): void {
    if (this.activeTool === 'eraser') {
      event.stopPropagation();
      const updated = this.drawings.filter((d) => d.id !== drawingId);
      this.drawings = updated;
      this.drawingsChange.emit(updated);
    }
  }

  // SVG Drawing path helpers
  getMarkerUrl(color: string): string {
    if (!color) return 'url(#arrow-yellow)';
    const clean = color.toLowerCase().replace('#', '').trim();
    if (['facc15', 'ffffff', '38bdf8', '4ade80', 'fb923c', 'f87171'].includes(clean)) {
      return `url(#arrow-${clean})`;
    }
    if (clean.includes('yellow')) return 'url(#arrow-yellow)';
    if (clean.includes('white')) return 'url(#arrow-white)';
    if (clean.includes('cyan') || clean.includes('sky') || clean.includes('blue')) return 'url(#arrow-cyan)';
    if (clean.includes('green')) return 'url(#arrow-green)';
    if (clean.includes('orange')) return 'url(#arrow-orange)';
    if (clean.includes('red')) return 'url(#arrow-red)';
    return `url(#arrow-${clean})`;
  }

  getSvgPath(drawing: TacticDrawing): string {
    const pts = drawing.points;
    if (!pts || pts.length === 0) return '';

    if (drawing.tool === 'freehand') {
      if (pts.length === 1) {
        return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
      }
      return pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    }

    if (drawing.tool === 'run' || drawing.tool === 'pass' || drawing.tool === 'dribble') {
      const p1 = pts[0];
      const p2 = pts[pts.length - 1];

      if (drawing.tool === 'dribble') {
        return this.createWavyPath(p1, p2);
      }

      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    return '';
  }

  createWavyPath(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.5) return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;

    // Tight wavelength for prominent, unmistakable dribble squiggles
    const wavelength = 3.0;
    const numWaves = Math.max(3, Math.round(dist / wavelength));
    const normalX = -dy / dist;
    const normalY = dx / dist;
    const amplitude = Math.min(3.2, Math.max(2.0, dist * 0.12));

    let path = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    for (let i = 0; i < numWaves; i++) {
      const t0 = i / numWaves;
      const t1 = (i + 1) / numWaves;
      const tMid1 = t0 + (t1 - t0) * 0.33;
      const tMid2 = t0 + (t1 - t0) * 0.67;

      const sign = i % 2 === 0 ? 1 : -1;
      const cp1X = p1.x + dx * tMid1 + normalX * amplitude * sign;
      const cp1Y = p1.y + dy * tMid1 + normalY * amplitude * sign;
      const cp2X = p1.x + dx * tMid2 + normalX * amplitude * sign;
      const cp2Y = p1.y + dy * tMid2 + normalY * amplitude * sign;

      const endX = p1.x + dx * t1;
      const endY = p1.y + dy * t1;

      path += ` C ${cp1X.toFixed(2)} ${cp1Y.toFixed(2)}, ${cp2X.toFixed(2)} ${cp2Y.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    }

    return path;
  }

  getZoneRect(drawing: TacticDrawing): { x: number; y: number; width: number; height: number } {
    const p1 = drawing.points[0];
    const p2 = drawing.points[drawing.points.length - 1] || p1;
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);
    return { x, y, width, height };
  }

  getZoneCircle(drawing: TacticDrawing): { cx: number; cy: number; rx: number; ry: number } {
    const p1 = drawing.points[0];
    const p2 = drawing.points[drawing.points.length - 1] || p1;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const rx = Math.abs(p2.x - p1.x) / 2;
    const ry = Math.abs(p2.y - p1.y) / 2;
    return { cx, cy, rx, ry };
  }

  // Active in-progress drawing preview path
  get activeDrawingPath(): string {
    const pts = this.currentDrawingPoints();
    if (pts.length < 2) return '';
    return this.getSvgPath({
      id: 'active',
      tool: this.activeTool as DrawingToolType,
      points: pts,
      color: this.activeColor,
      width: this.strokeWidth,
    });
  }

  get activeZoneRect(): { x: number; y: number; width: number; height: number } | null {
    if (this.activeTool !== 'zone_rect') return null;
    const pts = this.currentDrawingPoints();
    if (pts.length < 2) return null;
    return this.getZoneRect({
      id: 'active',
      tool: 'zone_rect',
      points: pts,
      color: this.activeColor,
      width: this.strokeWidth,
    });
  }

  get activeZoneCircle(): { cx: number; cy: number; rx: number; ry: number } | null {
    if (this.activeTool !== 'zone_circle') return null;
    const pts = this.currentDrawingPoints();
    if (pts.length < 2) return null;
    return this.getZoneCircle({
      id: 'active',
      tool: 'zone_circle',
      points: pts,
      color: this.activeColor,
      width: this.strokeWidth,
    });
  }
}
