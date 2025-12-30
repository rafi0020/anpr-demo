import { ROIPolygon, BBoxArray } from '@/types';
import { TraceLogger } from './TraceLogger';

export class ROI {
  private polygon: ROIPolygon | null = null;
  private logger: TraceLogger;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing: boolean = false;
  private tempPoints: Array<{ x: number; y: number }> = [];

  constructor(logger: TraceLogger) {
    this.logger = logger;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.logger.info('ROI', 'Canvas set', { 
      width: canvas.width, 
      height: canvas.height 
    });
  }

  startDrawing(): void {
    if (!this.canvas) {
      this.logger.error('ROI', 'Cannot start drawing without canvas');
      return;
    }

    this.isDrawing = true;
    this.tempPoints = [];
    this.logger.info('ROI', 'Started drawing ROI');
  }

  addPoint(x: number, y: number): void {
    if (!this.isDrawing) return;

    this.tempPoints.push({ x, y });
    this.logger.debug('ROI', 'Added point', { x, y, totalPoints: this.tempPoints.length });

    // Draw temporary polygon
    this.drawTempPolygon();
  }

  finishDrawing(): void {
    if (!this.isDrawing || this.tempPoints.length < 3) {
      this.logger.warn('ROI', 'Cannot finish ROI with less than 3 points');
      return;
    }

    this.polygon = {
      points: [...this.tempPoints],
      active: true,
      name: `ROI_${Date.now()}`
    };

    this.isDrawing = false;
    this.tempPoints = [];

    this.logger.info('ROI', 'ROI created', {
      pointCount: this.polygon.points.length,
      name: this.polygon.name
    });
  }

  cancelDrawing(): void {
    this.isDrawing = false;
    this.tempPoints = [];
    this.logger.info('ROI', 'Drawing cancelled');
  }

  private drawTempPolygon(): void {
    if (!this.ctx || this.tempPoints.length === 0) return;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(this.tempPoints[0].x, this.tempPoints[0].y);
    
    for (let i = 1; i < this.tempPoints.length; i++) {
      this.ctx.lineTo(this.tempPoints[i].x, this.tempPoints[i].y);
    }

    if (this.tempPoints.length > 2) {
      this.ctx.closePath();
      this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      this.ctx.fill();
    }

    this.ctx.stroke();

    // Draw points
    this.ctx.fillStyle = 'rgba(59, 130, 246, 1)';
    this.tempPoints.forEach(point => {
      this.ctx!.beginPath();
      this.ctx!.arc(point.x, point.y, 4, 0, Math.PI * 2);
      this.ctx!.fill();
    });

    this.ctx.restore();
  }

  drawROI(ctx?: CanvasRenderingContext2D): void {
    const context = ctx || this.ctx;
    if (!context || !this.polygon || !this.polygon.active) return;

    context.save();
    context.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);

    context.beginPath();
    context.moveTo(this.polygon.points[0].x, this.polygon.points[0].y);
    
    for (let i = 1; i < this.polygon.points.length; i++) {
      context.lineTo(this.polygon.points[i].x, this.polygon.points[i].y);
    }

    context.closePath();
    context.fillStyle = 'rgba(59, 130, 246, 0.1)';
    context.fill();
    context.stroke();

    // Draw corner points
    context.fillStyle = 'rgba(59, 130, 246, 1)';
    this.polygon.points.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }

  isPointInside(x: number, y: number): boolean {
    if (!this.polygon || !this.polygon.active) {
      return true; // If no ROI is set, consider all points as inside
    }

    return this.pointInPolygon(x, y, this.polygon.points);
  }

  isBBoxInside(bbox: BBoxArray, threshold: number = 0.5): boolean {
    if (!this.polygon || !this.polygon.active) {
      return true; // If no ROI is set, consider all boxes as inside
    }

    const [x1, y1, x2, y2] = bbox;
    
    // Check center point (most common approach)
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    
    if (threshold === 0.5) {
      return this.isPointInside(centerX, centerY);
    }

    // Check corners for threshold-based inclusion
    const corners = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 }
    ];

    const insideCount = corners.filter(corner => 
      this.isPointInside(corner.x, corner.y)
    ).length;

    return (insideCount / 4) >= threshold;
  }

  private pointInPolygon(x: number, y: number, points: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  setPolygon(polygon: ROIPolygon): void {
    this.polygon = polygon;
    this.logger.info('ROI', 'Polygon set', {
      pointCount: polygon.points.length,
      active: polygon.active,
      name: polygon.name
    });
  }

  getPolygon(): ROIPolygon | null {
    return this.polygon;
  }

  clearROI(): void {
    this.polygon = null;
    this.logger.info('ROI', 'ROI cleared');
  }

  toggleActive(): void {
    if (this.polygon) {
      this.polygon.active = !this.polygon.active;
      this.logger.info('ROI', 'ROI toggled', { active: this.polygon.active });
    }
  }

  saveToJSON(): string {
    if (!this.polygon) {
      this.logger.warn('ROI', 'No polygon to save');
      return '{}';
    }

    return JSON.stringify(this.polygon, null, 2);
  }

  loadFromJSON(json: string): void {
    try {
      const polygon = JSON.parse(json) as ROIPolygon;
      
      if (!polygon.points || !Array.isArray(polygon.points)) {
        throw new Error('Invalid polygon format');
      }

      this.polygon = polygon;
      this.logger.info('ROI', 'Polygon loaded from JSON', {
        pointCount: polygon.points.length,
        active: polygon.active
      });
    } catch (error) {
      this.logger.error('ROI', 'Failed to load polygon from JSON', { error });
      throw error;
    }
  }

  // Scale polygon points (useful when canvas size changes)
  scalePolygon(scaleX: number, scaleY: number): void {
    if (!this.polygon) return;

    this.polygon.points = this.polygon.points.map(point => ({
      x: point.x * scaleX,
      y: point.y * scaleY
    }));

    this.logger.info('ROI', 'Polygon scaled', { scaleX, scaleY });
  }

  // Get polygon bounds
  getBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    if (!this.polygon || this.polygon.points.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.polygon.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    return { minX, minY, maxX, maxY };
  }

  // Get polygon area (using Shoelace formula)
  getArea(): number {
    if (!this.polygon || this.polygon.points.length < 3) return 0;

    let area = 0;
    const points = this.polygon.points;

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
  }

  // Check if polygon is valid (no self-intersections)
  isValid(): boolean {
    if (!this.polygon || this.polygon.points.length < 3) return false;

    const points = this.polygon.points;

    // Check for self-intersections
    for (let i = 0; i < points.length; i++) {
      const a1 = points[i];
      const a2 = points[(i + 1) % points.length];

      for (let j = i + 2; j < points.length; j++) {
        if (i === 0 && j === points.length - 1) continue; // Skip adjacent edges

        const b1 = points[j];
        const b2 = points[(j + 1) % points.length];

        if (this.linesIntersect(a1, a2, b1, b2)) {
          return false;
        }
      }
    }

    return true;
  }

  private linesIntersect(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
  ): boolean {
    const ccw = (A: { x: number; y: number }, B: { x: number; y: number }, C: { x: number; y: number }) => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }
}
