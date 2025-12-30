import { CropImage, CropData } from '@/types';
import { TraceLogger } from './TraceLogger';

export interface FrameQuality {
  sharpness: number;
  contrast: number;
  area: number;
  overall: number;
}

export class BestFrameSelector {
  private logger: TraceLogger;
  
  // Weights for quality scoring
  private sharpnessWeight: number = 0.4;
  private contrastWeight: number = 0.3;
  private areaWeight: number = 0.3;

  constructor(logger: TraceLogger, config?: {
    sharpnessWeight?: number;
    contrastWeight?: number;
    areaWeight?: number;
  }) {
    this.logger = logger;
    this.sharpnessWeight = config?.sharpnessWeight ?? this.sharpnessWeight;
    this.contrastWeight = config?.contrastWeight ?? this.contrastWeight;
    this.areaWeight = config?.areaWeight ?? this.areaWeight;
  }

  selectBestFrame(crops: CropImage[]): CropImage | null {
    if (crops.length === 0) {
      this.logger.warn('BestFrameSelector', 'No crops provided for selection');
      return null;
    }

    if (crops.length === 1) {
      this.logger.debug('BestFrameSelector', 'Single crop, returning it', {
        cropId: crops[0].cropId
      });
      return crops[0];
    }

    // Calculate quality scores for each crop
    const scoredCrops = crops.map(crop => ({
      crop,
      quality: this.calculateQuality(crop)
    }));

    // Sort by overall quality score
    scoredCrops.sort((a, b) => b.quality.overall - a.quality.overall);

    const bestCrop = scoredCrops[0];

    this.logger.info('BestFrameSelector', 'Best frame selected', {
      bestCropId: bestCrop.crop.cropId,
      quality: bestCrop.quality,
      totalCrops: crops.length,
      qualityRange: {
        best: scoredCrops[0].quality.overall,
        worst: scoredCrops[scoredCrops.length - 1].quality.overall
      }
    });

    return bestCrop.crop;
  }

  selectBestFromCropData(crops: CropData[]): CropData | null {
    if (crops.length === 0) {
      this.logger.warn('BestFrameSelector', 'No crop data provided for selection');
      return null;
    }

    if (crops.length === 1) {
      return crops[0];
    }

    // Calculate quality scores for each crop
    const scoredCrops = crops.map(crop => ({
      crop,
      quality: this.calculateQualityFromData(crop)
    }));

    // Sort by overall quality score
    scoredCrops.sort((a, b) => b.quality.overall - a.quality.overall);

    const bestCrop = scoredCrops[0];

    this.logger.info('BestFrameSelector', 'Best crop data selected', {
      bestCropId: bestCrop.crop.cropId,
      quality: bestCrop.quality,
      totalCrops: crops.length
    });

    return bestCrop.crop;
  }

  private calculateQuality(crop: CropImage): FrameQuality {
    // If quality info exists, use it
    if (crop.quality) {
      const overall = 
        (crop.quality.sharpness * this.sharpnessWeight) +
        (crop.quality.contrast * this.contrastWeight) +
        (crop.quality.area * this.areaWeight);

      return {
        sharpness: crop.quality.sharpness,
        contrast: crop.quality.contrast,
        area: crop.quality.area,
        overall
      };
    }

    // If no quality info, estimate based on bbox
    const [x1, y1, x2, y2] = crop.bbox;
    const area = (x2 - x1) * (y2 - y1);
    const normalizedArea = Math.min(area / 10000, 1); // Normalize to 0-1

    // Default estimates
    const sharpness = 0.7;
    const contrast = 0.7;

    const overall = 
      (sharpness * this.sharpnessWeight) +
      (contrast * this.contrastWeight) +
      (normalizedArea * this.areaWeight);

    return {
      sharpness,
      contrast,
      area: normalizedArea,
      overall
    };
  }

  private calculateQualityFromData(crop: CropData): FrameQuality {
    const overall = 
      (crop.quality.sharpness * this.sharpnessWeight) +
      (crop.quality.contrast * this.contrastWeight) +
      (crop.quality.area * this.areaWeight);

    return {
      sharpness: crop.quality.sharpness,
      contrast: crop.quality.contrast,
      area: crop.quality.area,
      overall
    };
  }

  // Get top N best frames
  getTopFrames(crops: CropImage[], n: number = 3): CropImage[] {
    if (crops.length <= n) {
      return crops;
    }

    const scoredCrops = crops.map(crop => ({
      crop,
      quality: this.calculateQuality(crop)
    }));

    scoredCrops.sort((a, b) => b.quality.overall - a.quality.overall);

    const topCrops = scoredCrops.slice(0, n).map(s => s.crop);

    this.logger.debug('BestFrameSelector', 'Top frames selected', {
      requestedCount: n,
      returnedCount: topCrops.length
    });

    return topCrops;
  }

  // Calculate diversity score to ensure varied crop selection
  selectDiverseFrames(crops: CropImage[], n: number = 3): CropImage[] {
    if (crops.length <= n) {
      return crops;
    }

    const selected: CropImage[] = [];
    const remaining = [...crops];

    // First, add the best quality frame
    const scoredCrops = remaining.map((crop, index) => ({
      crop,
      index,
      quality: this.calculateQuality(crop)
    }));
    scoredCrops.sort((a, b) => b.quality.overall - a.quality.overall);
    
    selected.push(scoredCrops[0].crop);
    remaining.splice(scoredCrops[0].index, 1);

    // Add frames that are temporally diverse
    while (selected.length < n && remaining.length > 0) {
      let bestDiversity = -1;
      let bestIndex = 0;

      remaining.forEach((crop, index) => {
        const diversity = this.calculateTemporalDiversity(crop, selected);
        if (diversity > bestDiversity) {
          bestDiversity = diversity;
          bestIndex = index;
        }
      });

      selected.push(remaining[bestIndex]);
      remaining.splice(bestIndex, 1);
    }

    this.logger.debug('BestFrameSelector', 'Diverse frames selected', {
      requestedCount: n,
      returnedCount: selected.length
    });

    return selected;
  }

  private calculateTemporalDiversity(crop: CropImage, selected: CropImage[]): number {
    if (selected.length === 0) return 1;

    const minTimeDiff = Math.min(
      ...selected.map(s => Math.abs(crop.timeMs - s.timeMs))
    );

    // Normalize: higher is more diverse
    return minTimeDiff / 1000; // Seconds
  }
}
