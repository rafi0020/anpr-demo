import { ValidationResult } from '@/types';
import { TraceLogger } from './TraceLogger';

interface ValidationRules {
  regions: string[];
  letters: string[];
  digits: string[];
}

export class Validator {
  private logger: TraceLogger;
  private strictRules: ValidationRules;
  private demoFallbackEnabled: boolean = true;

  constructor(logger: TraceLogger, strictRules?: Partial<ValidationRules>) {
    this.logger = logger;
    this.strictRules = {
      regions: strictRules?.regions || [
        'ঢাকা', 'চট্টগ্রাম', 'খুলনা', 'রাজশাহী', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'
      ],
      letters: strictRules?.letters || [
        'সখী', 'বয', 'যায়র', 'ঢাকা', 'চট্ট', 'খুল', 'রাজ', 'বরি', 'সিল', 'রং', 'ময়'
      ],
      digits: strictRules?.digits || [
        '০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'
      ]
    };
  }

  validatePlate(plate: string): ValidationResult {
    const result: ValidationResult = {
      valid: false,
      mode: 'strict',
      plate,
      reasons: [],
      warnings: []
    };

    // Basic format check
    if (!plate || plate.trim().length === 0) {
      result.reasons.push('Empty or null plate text');
      this.logger.warn('Validator', 'Empty plate validation', { plate });
      return result;
    }

    // Check for Bengali characters
    if (!this.isBengaliText(plate)) {
      result.reasons.push('No Bengali characters found');
      if (result.warnings) {
        result.warnings.push('Plate contains non-Bengali characters');
      }
    }

    // Strict Bangla plate format validation
    const strictResult = this.validateStrictFormat(plate);
    if (strictResult.valid) {
      result.valid = true;
      result.mode = 'strict';
      result.reasons = ['Valid Bangla plate format'];
      result.metadata = strictResult.metadata;

      this.logger.info('Validator', 'Strict validation passed', {
        plate,
        metadata: strictResult.metadata
      });

      return result;
    }

    // Fallback validation for demo
    if (this.demoFallbackEnabled) {
      const fallbackResult = this.validateFallbackFormat(plate);
      if (fallbackResult.valid) {
        result.valid = true;
        result.mode = 'fallback';
        result.reasons = fallbackResult.reasons;
        result.warnings = [
          'Strict Bangla format not recognized',
          'Using demo fallback validation',
          'Production systems require strict format compliance'
        ];
        result.metadata = fallbackResult.metadata;

        this.logger.info('Validator', 'Fallback validation passed', {
          plate,
          reasons: fallbackResult.reasons
        });

        return result;
      }
    }

    // Validation failed
    result.reasons = strictResult.reasons;
    result.warnings = ['Plate format does not match Bangla standards'];

    this.logger.warn('Validator', 'Validation failed', {
      plate,
      reasons: result.reasons
    });

    return result;
  }

  private validateStrictFormat(plate: string): { valid: boolean; reasons: string[]; metadata?: any } {
    const reasons: string[] = [];

    // Expected format: Region-LLetters-DDigits (e.g., "ঢাকা-সখী-১২৩৪")
    const parts = plate.split('-');
    if (parts.length !== 3) {
      reasons.push(`Expected 3 parts separated by hyphens, got ${parts.length}`);
      return { valid: false, reasons };
    }

    const [region, letters, digits] = parts;

    // Validate region
    if (!this.strictRules.regions.includes(region)) {
      reasons.push(`Invalid region: ${region}`);
    }

    // Validate letters (should be 2-4 Bengali letters)
    if (letters.length < 2 || letters.length > 4) {
      reasons.push(`Letters part should be 2-4 characters, got ${letters.length}`);
    } else {
      for (const char of letters) {
        if (!this.isBengaliLetter(char)) {
          reasons.push(`Invalid letter character: ${char}`);
          break;
        }
      }
    }

    // Validate digits (should be 3-4 Bengali digits)
    if (digits.length < 3 || digits.length > 4) {
      reasons.push(`Digits part should be 3-4 characters, got ${digits.length}`);
    } else {
      for (const char of digits) {
        if (!this.strictRules.digits.includes(char)) {
          reasons.push(`Invalid digit character: ${char}`);
          break;
        }
      }
    }

    const valid = reasons.length === 0;

    return {
      valid,
      reasons: valid ? ['Strict Bangla format validation passed'] : reasons,
      metadata: valid ? {
        region,
        series: letters,
        vehicleType: this.inferVehicleType(letters),
        format: 'strict'
      } : undefined
    };
  }

  private validateFallbackFormat(plate: string): { valid: boolean; reasons: string[]; metadata?: any } {
    const reasons: string[] = [];

    // For demo purposes, accept plates that contain Bengali characters
    // and have reasonable length
    if (plate.length < 3 || plate.length > 20) {
      reasons.push(`Plate length should be 3-20 characters, got ${plate.length}`);
      return { valid: false, reasons };
    }

    // Check for at least some Bengali content
    const bengaliChars = plate.split('').filter(char => this.isBengaliChar(char));
    if (bengaliChars.length < 2) {
      reasons.push('Insufficient Bengali characters for fallback validation');
      return { valid: false, reasons };
    }

    // Check for basic structure (contains separators or is continuous)
    const hasSeparators = plate.includes('-') || plate.includes(' ');
    if (!hasSeparators && plate.length > 10) {
      reasons.push('Long plates should contain separators for readability');
    }

    reasons.push('Demo fallback validation passed');
    reasons.push(`Found ${bengaliChars.length} Bengali characters`);

    return {
      valid: true,
      reasons,
      metadata: {
        format: 'fallback',
        bengaliCharCount: bengaliChars.length,
        hasSeparators
      }
    };
  }

  private isBengaliText(text: string): boolean {
    return /[\u0980-\u09FF]/.test(text);
  }

  private isBengaliLetter(char: string): boolean {
    // Bengali letters range: U+0985 to U+09B9, U+09BE to U+09CC, etc.
    const code = char.charCodeAt(0);
    return (code >= 0x0985 && code <= 0x09B9) ||
           (code >= 0x09BE && code <= 0x09CC) ||
           (code >= 0x09D7 && code <= 0x09DC);
  }

  private isBengaliChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x0980 && code <= 0x09FF;
  }

  private inferVehicleType(letters: string): string {
    // Simple inference based on letter patterns
    if (letters.includes('সখী')) return 'Private Vehicle';
    if (letters.includes('বয')) return 'Commercial Vehicle';
    if (letters.includes('যায়র')) return 'Government Vehicle';
    return 'Unknown';
  }

  // Update validation rules
  updateRules(newRules: Partial<ValidationRules>): void {
    this.strictRules = { ...this.strictRules, ...newRules };
    this.logger.info('Validator', 'Validation rules updated', newRules);
  }

  // Enable/disable demo fallback
  setDemoFallback(enabled: boolean): void {
    this.demoFallbackEnabled = enabled;
    this.logger.info('Validator', 'Demo fallback mode', { enabled });
  }

  // Get current rules
  getRules(): ValidationRules {
    return { ...this.strictRules };
  }

  // Validate multiple plates
  validateBatch(plates: string[]): ValidationResult[] {
    this.logger.info('Validator', 'Batch validation started', { count: plates.length });

    const results = plates.map(plate => this.validatePlate(plate));

    const passed = results.filter(r => r.valid).length;
    const failed = results.length - passed;

    this.logger.info('Validator', 'Batch validation completed', {
      total: results.length,
      passed,
      failed
    });

    return results;
  }

  // Get validation statistics
  getStatistics(): {
    totalValidations: number;
    strictPasses: number;
    fallbackPasses: number;
    failures: number;
    commonFailureReasons: Record<string, number>;
  } {
    // In a real implementation, this would track statistics
    // For demo purposes, return mock data
    return {
      totalValidations: 0,
      strictPasses: 0,
      fallbackPasses: 0,
      failures: 0,
      commonFailureReasons: {}
    };
  }
}
