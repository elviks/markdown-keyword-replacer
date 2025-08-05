export interface KeywordVariant {
  id: string;
  text: string;
  priority: 1 | 2 | 3 | 4 | 5;
}

export interface ProcessingOptions {
  skipHeaders: boolean;
  skipTables: boolean;
  sectionTailMode: boolean;
  tailSkipAmount: number;
}

export interface ProcessingResult {
  processedText: string;
  totalMatches: number;
  totalReplacements: number;
  replacementsByPriority: Record<number, number>;
  sectionsProcessed: number;
  processingTime: number;
  replacements?: Array<{ original: string; replacement: string; position: number }>;
}

export interface ReplacementPool {
  variants: KeywordVariant[];
  priorityPercentages: Record<number, number>;
  pool: string[];
  currentIndex: number;
}