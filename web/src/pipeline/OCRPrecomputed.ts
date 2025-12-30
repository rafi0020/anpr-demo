import { OCRData, OCRCandidate, CropImage } from '@/types';
import { TraceLogger } from './TraceLogger';

export class OCRPrecomputed {
  private ocrData: OCRData | null = null;
  private logger: TraceLogger;

  constructor(logger: TraceLogger) {
    this.logger = logger;
  }

  async loadOCRData(videoId: string, baseUrl: string = '/'): Promise<void> {
    try {
      const response = await fetch(`${baseUrl}assets/ocr/${videoId}.ocr.json`);
      if (!response.ok) {
        throw new Error(`Failed to load OCR data: ${response.status}`);
      }

      this.ocrData = await response.json();

      if (this.ocrData) {
        this.logger.info('OCRPrecomputed', 'OCR data loaded', {
          videoId,
          tracksCount: Object.keys(this.ocrData.tracks).length,
          totalCrops: Object.values(this.ocrData.tracks).reduce(
            (sum, track) => sum + track.crops.length, 0
          )
        });
      }
    } catch (error) {
      this.logger.error('OCRPrecomputed', 'Failed to load OCR data', { error, videoId });
      throw error;
    }
  }

  getCandidatesForCrop(cropId: string): OCRCandidate[] {
    if (!this.ocrData) {
      this.logger.warn('OCRPrecomputed', 'OCR data not loaded');
      return [];
    }

    // Find the crop in any track
    for (const track of Object.values(this.ocrData.tracks)) {
      const crop = track.crops.find(c => c.cropId === cropId);
      if (crop) {
        this.logger.debug('OCRPrecomputed', 'Found OCR candidates', {
          cropId,
          candidateCount: crop.candidates.length,
          bestCandidate: crop.candidates[0]?.text || 'none'
        });

        return crop.candidates;
      }
    }

    this.logger.warn('OCRPrecomputed', 'Crop not found in OCR data', { cropId });
    return [];
  }

  getCandidatesForTrack(trackId: string): OCRCandidate[][] {
    if (!this.ocrData || !this.ocrData.tracks[trackId]) {
      this.logger.warn('OCRPrecomputed', 'Track not found in OCR data', { trackId });
      return [];
    }

    const track = this.ocrData.tracks[trackId];
    const candidates = track.crops.map(crop => crop.candidates);

    this.logger.debug('OCRPrecomputed', 'Retrieved track candidates', {
      trackId,
      cropCount: track.crops.length,
      totalCandidates: candidates.flat().length
    });

    return candidates;
  }

  getBestCandidateForCrop(cropId: string): OCRCandidate | null {
    const candidates = this.getCandidatesForCrop(cropId);
    if (candidates.length === 0) return null;

    // Return candidate with highest confidence
    return candidates.reduce((best, current) =>
      current.conf > best.conf ? current : best
    );
  }

  getBestCandidateForTrack(trackId: string): OCRCandidate | null {
    const allCandidates = this.getCandidatesForTrack(trackId).flat();
    if (allCandidates.length === 0) return null;

    // Return candidate with highest confidence across all crops
    return allCandidates.reduce((best, current) =>
      current.conf > best.conf ? current : best
    );
  }

  getOCRData(): OCRData | null {
    return this.ocrData;
  }

  getTrackIds(): string[] {
    return this.ocrData ? Object.keys(this.ocrData.tracks) : [];
  }

  getCropIdsForTrack(trackId: string): string[] {
    if (!this.ocrData || !this.ocrData.tracks[trackId]) {
      return [];
    }

    return this.ocrData.tracks[trackId].crops.map(crop => crop.cropId);
  }

  getStatistics(): {
    totalTracks: number;
    totalCrops: number;
    totalCandidates: number;
    avgCandidatesPerCrop: number;
    avgConfidence: number;
    language: string;
  } {
    if (!this.ocrData) {
      return {
        totalTracks: 0,
        totalCrops: 0,
        totalCandidates: 0,
        avgCandidatesPerCrop: 0,
        avgConfidence: 0,
        language: 'unknown'
      };
    }

    const tracks = Object.values(this.ocrData.tracks);
    const totalCrops = tracks.reduce((sum, track) => sum + track.crops.length, 0);
    const totalCandidates = tracks.reduce(
      (sum, track) => sum + track.crops.reduce((cropSum, crop) => cropSum + crop.candidates.length, 0),
      0
    );

    const allConfidences = tracks.flatMap(track =>
      track.crops.flatMap(crop => crop.candidates.map(c => c.conf))
    );

    const avgConfidence = allConfidences.length > 0
      ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
      : 0;

    return {
      totalTracks: tracks.length,
      totalCrops,
      totalCandidates,
      avgCandidatesPerCrop: totalCrops > 0 ? totalCandidates / totalCrops : 0,
      avgConfidence,
      language: this.ocrData.metadata.language
    };
  }

  // Method to simulate OCR processing for new crops (for annotation tool)
  simulateOCR(crop: CropImage): OCRCandidate[] {
    // For demo purposes, return mock candidates
    // In production, this would call actual OCR service
    const mockCandidates: OCRCandidate[] = [
      { text: 'সখী-বয-যায়র', conf: 0.93 },
      { text: 'সখী-বয-যায়ব', conf: 0.61 },
      { text: 'সখী-বয-যায়র', conf: 0.45 },
      { text: 'সখী-বয-যায়ব', conf: 0.32 },
      { text: 'সখী-বয-যায়র', conf: 0.28 }
    ];

    this.logger.info('OCRPrecomputed', 'Simulated OCR processing', {
      cropId: crop.cropId,
      candidates: mockCandidates.length,
      bestText: mockCandidates[0].text,
      bestConf: mockCandidates[0].conf
    });

    return mockCandidates;
  }

  reset(): void {
    this.ocrData = null;
    this.logger.info('OCRPrecomputed', 'OCR data reset');
  }
}
