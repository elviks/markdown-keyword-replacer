import type { KeywordVariant, ProcessingOptions, ProcessingResult } from '../types';

export class KeywordProcessor {
  processArticle(
    articleText: string,
    mainKeyword: string,
    keywordVariants: KeywordVariant[],
    replacementPercentage: number,
    exclusionKeywords: string[],
    processingOptions: ProcessingOptions
  ): ProcessingResult {
    const startTime = performance.now();

    console.log('[DEBUG] Processing started with options:', processingOptions);

    // Validate inputs
    if (!articleText.trim() || !mainKeyword.trim() || keywordVariants.length === 0) {
      return {
        processedText: articleText,
        totalMatches: 0,
        totalReplacements: 0,
        replacementsByPriority: {},
        sectionsProcessed: 0,
        processingTime: performance.now() - startTime,
        replacements: []
      };
    }

    // Check for exclusion keywords first
    if (exclusionKeywords.length > 0) {
      const hasExclusionKeywords = exclusionKeywords.some(keyword =>
        articleText.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasExclusionKeywords) {
        console.log('[DEBUG] Exclusion keywords found, skipping processing');
        return {
          processedText: articleText,
          totalMatches: 0,
          totalReplacements: 0,
          replacementsByPriority: {},
          sectionsProcessed: 1,
          processingTime: performance.now() - startTime,
          replacements: []
        };
      }
    }

    // Process the article based on options
    let result: { processedText: string; replacements: Array<{ original: string; replacement: string; position: number }> };
    let sectionsProcessed = 1;

    if (processingOptions.sectionTailMode) {
      // Process by H2 sections with tail mode
      const sectionResult = this.processBySections(articleText, mainKeyword, keywordVariants, replacementPercentage, processingOptions);
      result = { processedText: sectionResult.processedText, replacements: sectionResult.replacements };
      sectionsProcessed = sectionResult.sectionsProcessed;
    } else {
      // Process entire article
      result = this.processTextBlock(articleText, mainKeyword, keywordVariants, replacementPercentage, processingOptions);
    }

    // Calculate final statistics
    const keywordRegex = new RegExp(`\\b${this.escapeRegex(mainKeyword)}\\b`, 'gi');
    const originalMatches = Array.from(articleText.matchAll(keywordRegex));
    const processedMatches = Array.from(result.processedText.matchAll(keywordRegex));
    const totalReplacements = originalMatches.length - processedMatches.length;


    // Calculate replacements by priority
    const replacementsByPriority: Record<number, number> = {};
    keywordVariants.forEach(variant => {
      replacementsByPriority[variant.priority] = 0;
    });

    // Count replacements by priority from our tracked replacements
    result.replacements.forEach(replacement => {
      const variant = keywordVariants.find(v => v.text.toLowerCase() === replacement.replacement.toLowerCase());
      if (variant) {
        replacementsByPriority[variant.priority]++;
      }
    });

    const endTime = performance.now();

    return {
      processedText: result.processedText,
      totalMatches: originalMatches.length,
      totalReplacements: totalReplacements,
      replacementsByPriority,
      sectionsProcessed,
      processingTime: endTime - startTime,
      replacements: result.replacements
    };
  }


  private processBySections(
    articleText: string,
    mainKeyword: string,
    keywordVariants: KeywordVariant[],
    replacementPercentage: number,
    processingOptions: ProcessingOptions
  ): { processedText: string; sectionsProcessed: number; replacements: Array<{ original: string; replacement: string; position: number }> } {
    console.log('[DEBUG] Processing by H2 sections with tail mode');

    const lines = articleText.split('\n');
    const processedLines: string[] = [];
    let currentSection: string[] = [];
    let sectionsProcessed = 0;
    let allReplacements: Array<{ original: string; replacement: string; position: number }> = [];

    const h2Pattern = /^##\s+/;

    const processCurrentSection = () => {
      if (currentSection.length === 0) return;

      const sectionText = currentSection.join('\n');

      // Apply section tail filtering
      if (processingOptions.sectionTailMode) {
        const sectionLines = currentSection;
        const skipLines = Math.floor(sectionLines.length * (processingOptions.tailSkipAmount / 100));

        if (skipLines > 0 && skipLines < sectionLines.length - 1) {
          const skippedLines = sectionLines.slice(0, skipLines);
          const processableLines = sectionLines.slice(skipLines);

          console.log(`[DEBUG] Section tail: Skipping ${skipLines}/${sectionLines.length} lines`);

          // Process only the tail part
          const result = this.processTextBlock(
            processableLines.join('\n'),
            mainKeyword,
            keywordVariants,
            replacementPercentage,
            processingOptions
          );

          // Combine skipped part with processed tail
          processedLines.push(...skippedLines);
          processedLines.push(...result.processedText.split('\n'));
          allReplacements.push(...result.replacements);
          sectionsProcessed++;
          return;
        }
      }

      // Process entire section normally
      const result = this.processTextBlock(sectionText, mainKeyword, keywordVariants, replacementPercentage, processingOptions);
      processedLines.push(...result.processedText.split('\n'));
      allReplacements.push(...result.replacements);
      sectionsProcessed++;
    };

    for (const line of lines) {
      if (h2Pattern.test(line)) {
        // Process accumulated section before starting new one
        processCurrentSection();
        currentSection = [];

        // Add H2 header as-is
        processedLines.push(line);
      } else {
        currentSection.push(line);
      }
    }

    // Process final section
    processCurrentSection();

    return {
      processedText: processedLines.join('\n'),
      sectionsProcessed,
      replacements: allReplacements
    };
  }

  private processTextBlock(
    textBlock: string,
    mainKeyword: string,
    keywordVariants: KeywordVariant[],
    replacementPercentage: number,
    processingOptions: ProcessingOptions
  ): { processedText: string; replacements: Array<{ original: string; replacement: string; position: number }> } {
    if (!textBlock.trim()) return { processedText: textBlock, replacements: [] };

    // Apply line-level filtering (skip headers and tables)
    const lines = textBlock.split('\n');
    const processableLines: string[] = [];
    const skippedLineIndices: number[] = [];

    lines.forEach((line, index) => {
      const shouldSkip = this.shouldSkipLine(line, processingOptions);
      if (shouldSkip) {
        skippedLineIndices.push(index);
      } else {
        processableLines.push(line);
      }
    });

    if (processableLines.length === 0) {
      console.log('[DEBUG] All lines would be skipped, returning original');
      return { processedText: textBlock, replacements: [] };
    }

    // Process the filterable content
    const processableText = processableLines.join('\n');
    const result = this.replaceKeywords(processableText, mainKeyword, keywordVariants, replacementPercentage);

    // If we had skipped lines, reconstruct the full text
    if (skippedLineIndices.length > 0) {
      const processedLines = result.processedText.split('\n');
      const reconstructedLines: string[] = [];
      let processedIndex = 0;

      lines.forEach((originalLine, index) => {
        if (skippedLineIndices.includes(index)) {
          reconstructedLines.push(originalLine); // Keep original skipped line
        } else {
          reconstructedLines.push(processedLines[processedIndex] || originalLine);
          processedIndex++;
        }
      });

      return { processedText: reconstructedLines.join('\n'), replacements: result.replacements };
    }

    return result;
  }

  private shouldSkipLine(line: string, options: ProcessingOptions): boolean {
    const trimmed = line.trim();

    // Skip headers (H1-H6)
    if (options.skipHeaders && /^#{1,6}\s+/.test(trimmed)) {
      console.log('[DEBUG] Skipping header:', trimmed.substring(0, 50));
      return true;
    }

    // Skip table rows (lines with multiple |)
    if (options.skipTables && trimmed.includes('|') && trimmed.split('|').length >= 3) {
      console.log('[DEBUG] Skipping table row:', trimmed.substring(0, 50));
      return true;
    }

    return false;
  }

  private replaceKeywords(
    text: string,
    mainKeyword: string,
    keywordVariants: KeywordVariant[],
    replacementPercentage: number
  ): { processedText: string; replacements: Array<{ original: string; replacement: string; position: number }> } {
    // Find all matches of the main keyword
    const keywordRegex = new RegExp(`\\b${this.escapeRegex(mainKeyword)}\\b`, 'gi');
    const matches = Array.from(text.matchAll(keywordRegex));

    if (matches.length === 0) {
      return { processedText: text, replacements: [] };
    }

    console.log(`[DEBUG] Found ${matches.length} matches of "${mainKeyword}"`);

    // Calculate total replacements needed
    const totalReplacements = Math.max(1, Math.floor(matches.length * (replacementPercentage / 100)));
    console.log(`[DEBUG] Will make ${totalReplacements} replacements (${replacementPercentage}%)`);

    // Create replacement pool with proper priority distribution
    const replacementPool = this.createReplacementPool(keywordVariants, totalReplacements);

    // Select random matches to replace
    const matchesToReplace = this.selectRandomMatches(matches, totalReplacements);

    // Track replacements
    const replacements: Array<{ original: string; replacement: string; position: number }> = [];

    // Apply replacements from end to start to maintain positions
    let processedText = text;
    const sortedMatches = matchesToReplace.sort((a, b) => (b.index || 0) - (a.index || 0));

    sortedMatches.forEach((match, index) => {
      const replacement = replacementPool[index % replacementPool.length];
      const originalText = match[0];
      const position = match.index || 0;

      // Calculate line number
      const textBeforeMatch = text.substring(0, position);
      const lineNumber = textBeforeMatch.split('\n').length;

      // Apply case preservation
      let finalReplacement = replacement;
      if (originalText && originalText[0] === originalText[0].toUpperCase() && originalText[0].toLowerCase() !== originalText[0].toUpperCase() && finalReplacement) {
        finalReplacement = finalReplacement[0].toUpperCase() + finalReplacement.slice(1);
      } else if (originalText && originalText === originalText.toUpperCase() && originalText.toLowerCase() !== originalText.toUpperCase() && finalReplacement) {
        finalReplacement = finalReplacement.toUpperCase();
      }

      // Track this replacement
      replacements.push({
        original: originalText,
        replacement: finalReplacement,
        position: lineNumber
      });

      // Apply replacement
      processedText = processedText.substring(0, position) +
        finalReplacement +
        processedText.substring(position + originalText.length);

      console.log(`[DEBUG] Replaced "${originalText}" with "${finalReplacement}" at position ${position}`);
    });

    return { processedText, replacements };
  }

  private createReplacementPool(variants: KeywordVariant[], totalReplacements: number): string[] {
    console.log(`[DEBUG] Creating replacement pool for ${totalReplacements} total replacements`);

    // Priority percentages
    const priorityPercentages: Record<number, number> = {
      1: 50, // Priority 1 gets 50% of ALL replacements
      2: 25, // Priority 2 gets 25% of ALL replacements
      3: 15, // Priority 3 gets 15% of ALL replacements
      4: 7,  // Priority 4 gets 7% of ALL replacements
      5: 3   // Priority 5 gets 3% of ALL replacements
    };

    // Group variants by priority
    const variantsByPriority = variants.reduce((acc, variant) => {
      if (!acc[variant.priority]) {
        acc[variant.priority] = [];
      }
      acc[variant.priority].push(variant);
      return acc;
    }, {} as Record<number, KeywordVariant[]>);

    const pool: string[] = [];

    // Calculate replacements for each priority level
    Object.keys(variantsByPriority).forEach(priorityStr => {
      const priority = parseInt(priorityStr);
      const percentage = priorityPercentages[priority] || 5;
      const variantsAtThisPriority = variantsByPriority[priority];

      // Calculate how many replacements this priority level should get
      let replacementsForThisPriority = Math.round(totalReplacements * percentage / 100);

      // Ensure at least 1 replacement if there are enough total replacements
      if (totalReplacements >= variants.length && replacementsForThisPriority === 0) {
        replacementsForThisPriority = 1;
      }

      console.log(`[DEBUG] Priority ${priority}: ${replacementsForThisPriority} replacements (${percentage}%) for ${variantsAtThisPriority.length} variants`);

      // Distribute replacements evenly among variants at this priority level
      const baseReplacementsPerVariant = Math.floor(replacementsForThisPriority / variantsAtThisPriority.length);
      const remainder = replacementsForThisPriority % variantsAtThisPriority.length;

      variantsAtThisPriority.forEach((variant, index) => {
        const variantReplacements = baseReplacementsPerVariant + (index < remainder ? 1 : 0);

        for (let i = 0; i < variantReplacements; i++) {
          pool.push(variant.text);
        }

        console.log(`[DEBUG]   "${variant.text}": ${variantReplacements} replacements`);
      });
    });

    // Adjust pool size to match exactly totalReplacements
    while (pool.length < totalReplacements) {
      const highestPriority = Math.min(...Object.keys(variantsByPriority).map(Number));
      const highestPriorityVariants = variantsByPriority[highestPriority];
      const randomVariant = highestPriorityVariants[Math.floor(Math.random() * highestPriorityVariants.length)];
      pool.push(randomVariant.text);
    }

    while (pool.length > totalReplacements) {
      pool.pop();
    }

    console.log(`[DEBUG] Final pool size: ${pool.length}, Target: ${totalReplacements}`);

    // Shuffle the pool for randomness while maintaining the distribution
    return this.shuffleArray(pool);
  }

  private selectRandomMatches(matches: RegExpMatchArray[], count: number): RegExpMatchArray[] {
    if (matches.length <= count) {
      return matches;
    }

    const shuffled = this.shuffleArray([...matches]);
    return shuffled.slice(0, count);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}