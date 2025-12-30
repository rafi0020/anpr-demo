import { VoteResult, OCRCandidate } from '@/types';
import { TraceLogger } from './TraceLogger';

export class Voter {
  private logger: TraceLogger;

  constructor(logger: TraceLogger) {
    this.logger = logger;
  }

  vote(candidates: OCRCandidate[][]): VoteResult {
    if (candidates.length === 0) {
      this.logger.warn('Voter', 'No candidates provided for voting');
      return this.createEmptyResult();
    }

    // Flatten all candidates
    const allCandidates = candidates.flat();

    if (allCandidates.length === 0) {
      this.logger.warn('Voter', 'No candidates found in input');
      return this.createEmptyResult();
    }

    // Group by text and calculate statistics
    const textGroups = new Map<string, {
      count: number;
      confidences: number[];
      candidates: OCRCandidate[];
    }>();

    allCandidates.forEach(candidate => {
      if (!textGroups.has(candidate.text)) {
        textGroups.set(candidate.text, {
          count: 0,
          confidences: [],
          candidates: []
        });
      }

      const group = textGroups.get(candidate.text)!;
      group.count++;
      group.confidences.push(candidate.conf);
      group.candidates.push(candidate);
    });

    // Convert to array and sort by voting method
    const voteCandidates = Array.from(textGroups.entries()).map(([text, data]) => ({
      text,
      count: data.count,
      avgConfidence: data.confidences.reduce((sum, conf) => sum + conf, 0) / data.confidences.length,
      maxConfidence: Math.max(...data.confidences),
      totalConfidence: data.confidences.reduce((sum, conf) => sum + conf, 0)
    }));

    // Sort by frequency first (most common)
    voteCandidates.sort((a, b) => b.count - a.count);

    // Find the winner using the voting algorithm
    let winner: typeof voteCandidates[0];
    let method: 'frequency' | 'confidence' | 'tiebreak';

    // Check if there's a clear frequency winner
    if (voteCandidates.length === 1 || voteCandidates[0].count > voteCandidates[1].count) {
      winner = voteCandidates[0];
      method = 'frequency';
    } else {
      // Tie in frequency, use confidence tiebreaker
      const tiedCandidates = voteCandidates.filter(c => c.count === voteCandidates[0].count);

      // Sort tied candidates by average confidence
      tiedCandidates.sort((a, b) => b.avgConfidence - a.avgConfidence);

      if (tiedCandidates.length === 1 || tiedCandidates[0].avgConfidence > tiedCandidates[1].avgConfidence) {
        winner = tiedCandidates[0];
        method = 'confidence';
      } else {
        // Still tied, use max confidence
        tiedCandidates.sort((a, b) => b.maxConfidence - a.maxConfidence);
        winner = tiedCandidates[0];
        method = 'tiebreak';
      }
    }

    const result: VoteResult = {
      winner: winner.text,
      confidence: winner.avgConfidence,
      votes: Object.fromEntries(voteCandidates.map(c => [c.text, c.count])),
      method,
      candidates: voteCandidates.map(c => ({
        text: c.text,
        count: c.count,
        avgConfidence: c.avgConfidence,
        maxConfidence: c.maxConfidence
      }))
    };

    this.logger.info('Voter', 'Voting completed', {
      winner: winner.text,
      confidence: winner.avgConfidence,
      method,
      totalCandidates: allCandidates.length,
      uniqueTexts: voteCandidates.length,
      cropCount: candidates.length
    });

    return result;
  }

  voteSingleCrop(candidates: OCRCandidate[]): VoteResult {
    return this.vote([candidates]);
  }

  getVotingStatistics(candidates: OCRCandidate[][]): {
    totalCrops: number;
    totalCandidates: number;
    uniqueTexts: number;
    avgCandidatesPerCrop: number;
    confidenceRange: { min: number; max: number; avg: number };
  } {
    const allCandidates = candidates.flat();

    if (allCandidates.length === 0) {
      return {
        totalCrops: 0,
        totalCandidates: 0,
        uniqueTexts: 0,
        avgCandidatesPerCrop: 0,
        confidenceRange: { min: 0, max: 0, avg: 0 }
      };
    }

    const uniqueTexts = new Set(allCandidates.map(c => c.text)).size;
    const confidences = allCandidates.map(c => c.conf);

    return {
      totalCrops: candidates.length,
      totalCandidates: allCandidates.length,
      uniqueTexts,
      avgCandidatesPerCrop: candidates.length > 0 ? allCandidates.length / candidates.length : 0,
      confidenceRange: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        avg: confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      }
    };
  }

  private createEmptyResult(): VoteResult {
    return {
      winner: '',
      confidence: 0,
      votes: {},
      method: 'frequency',
      candidates: []
    };
  }

  // Method to simulate voting for demo purposes
  simulateVote(expectedWinner: string): VoteResult {
    const mockCandidates = [
      { text: expectedWinner, count: 5, avgConfidence: 0.87, maxConfidence: 0.93 },
      { text: expectedWinner.replace('র', 'ব'), count: 2, avgConfidence: 0.61, maxConfidence: 0.68 },
      { text: expectedWinner.replace('যায়র', 'যায়ব'), count: 1, avgConfidence: 0.45, maxConfidence: 0.45 }
    ];

    return {
      winner: expectedWinner,
      confidence: 0.87,
      votes: Object.fromEntries(mockCandidates.map(c => [c.text, c.count])),
      method: 'frequency',
      candidates: mockCandidates
    };
  }
}
