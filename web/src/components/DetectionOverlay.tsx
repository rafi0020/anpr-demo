import React, { useRef, useEffect, useState } from 'react';
import { Detection, Track, ROIPolygon } from '@/types';

interface DetectionOverlayProps {
  detections: Detection[];
  tracks: Track[];
  roi: ROIPolygon | null;
  onROIUpdate: (roi: ROIPolygon) => void;
  videoWidth?: number;  // Original video width (e.g., 1920)
  videoHeight?: number; // Original video height (e.g., 1080)
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  tracks,
  roi,
  onROIUpdate: _onROIUpdate,
  videoWidth = 1920,
  videoHeight = 1080,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      console.log('DetectionOverlay: Resizing canvas to', rect.width, 'x', rect.height);
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for more accurate resize detection
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Draw detections, tracks, and ROI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Debug: Log detections
    if (detections.length > 0) {
      console.log('DetectionOverlay: Drawing', detections.length, 'detections', detections);
    }

    // Calculate video aspect ratio and canvas aspect ratio
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvas.width / canvas.height;

    let renderWidth = canvas.width;
    let renderHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    // Video uses object-contain, so calculate actual render size
    if (canvasAspect > videoAspect) {
      // Canvas is wider than video - video has vertical bars on sides
      renderWidth = canvas.height * videoAspect;
      offsetX = (canvas.width - renderWidth) / 2;
    } else {
      // Canvas is taller than video - video has horizontal bars on top/bottom
      renderHeight = canvas.width / videoAspect;
      offsetY = (canvas.height - renderHeight) / 2;
    }

    // Calculate scale factors based on actual render size
    const scaleX = renderWidth / videoWidth;
    const scaleY = renderHeight / videoHeight;

    // Fine-tune adjustment (move slightly left and down)
    const adjustX = -25; // Negative = left
    const adjustY = 30;  // Positive = down

    console.log('DetectionOverlay: Canvas', canvas.width, 'x', canvas.height, 
                'Render:', renderWidth, 'x', renderHeight, 
                'Offset:', offsetX, offsetY, 
                'Scale:', scaleX, scaleY);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ROI if present
    if (roi && roi.active) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(roi.points[0].x * scaleX + offsetX + adjustX, roi.points[0].y * scaleY + offsetY + adjustY);

      for (let i = 1; i < roi.points.length; i++) {
        ctx.lineTo(roi.points[i].x * scaleX + offsetX + adjustX, roi.points[i].y * scaleY + offsetY + adjustY);
      }

      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
      ctx.stroke();

      // Draw corner points
      ctx.fillStyle = 'rgba(59, 130, 246, 1)';
      roi.points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x * scaleX + offsetX + adjustX, point.y * scaleY + offsetY + adjustY, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw detections
    detections.forEach(detection => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      // Scale coordinates to canvas size and add offset with adjustment
      const scaledX1 = x1 * scaleX + offsetX + adjustX;
      const scaledY1 = y1 * scaleY + offsetY + adjustY;
      const scaledX2 = x2 * scaleX + offsetX + adjustX;
      const scaledY2 = y2 * scaleY + offsetY + adjustY;
      const scaledWidth = scaledX2 - scaledX1;
      const scaledHeight = scaledY2 - scaledY1;

      // Different colors for different types
      if (detection.type === 'plate') {
        ctx.strokeStyle = '#10B981'; // Green for plates
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 3; // Thicker line for plates
      } else {
        ctx.strokeStyle = '#3B82F6'; // Blue for vehicles
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 2;
      }

      ctx.setLineDash([]);

      // Draw bounding box
      ctx.fillRect(scaledX1, scaledY1, scaledWidth, scaledHeight);
      ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);

      // Draw label background
      const label = `${detection.type}: ${(detection.conf * 100).toFixed(1)}%`;
      ctx.font = '12px monospace';
      const textWidth = ctx.measureText(label).width;
      
      if (detection.type === 'plate') {
        ctx.fillStyle = '#10B981'; // Green background for plate labels
      } else {
        ctx.fillStyle = '#3B82F6'; // Blue background for vehicle labels
      }
      ctx.fillRect(scaledX1, scaledY1 - 18, textWidth + 6, 16);

      // Draw confidence text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, scaledX1 + 3, scaledY1 - 5);
    });

    // Draw track IDs
    tracks.forEach(track => {
      if (track.status === 'active') {
        const [x1, y1, x2] = track.bbox;
        const scaledX1 = x1 * scaleX + offsetX + adjustX;
        const scaledY1 = y1 * scaleY + offsetY + adjustY;
        const scaledX2 = x2 * scaleX + offsetX + adjustX;
        const centerX = (scaledX1 + scaledX2) / 2;
        const centerY = scaledY1 - 15;

        // Draw track ID label
        ctx.fillStyle = '#EF4444'; // Red background
        ctx.fillRect(centerX - 15, centerY - 8, 30, 16);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(track.id.toString(), centerX, centerY + 4);
        ctx.textAlign = 'left';
      }
    });

  }, [detections, tracks, roi, videoWidth, videoHeight, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-10"
    />
  );
};

export default DetectionOverlay;
