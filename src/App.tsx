import React, { useState, useCallback, useRef } from 'react';
import { FileText, Settings, Play, Download, Copy, Eye, EyeOff } from 'lucide-react';
import { KeywordProcessor } from './utils/keywordProcessor';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { KeywordVariantInput } from './components/KeywordVariantInput';
import { ProcessingSettings } from './components/ProcessingSettings';
import { ProcessingStats } from './components/ProcessingStats';
import { ExclusionKeywords } from './components/ExclusionKeywords';
import { DemoTester } from './components/DemoTester';
import { ReplacedWordsList } from './components/ReplacedWordsList';
import type { KeywordVariant, ProcessingOptions, ProcessingResult } from './types';

function App() {
  const [articleText, setArticleText] = useState('');
  const [mainKeyword, setMainKeyword] = useState('');
  const [keywordVariants, setKeywordVariants] = useState<KeywordVariant[]>([]);
  const [exclusionKeywords, setExclusionKeywords] = useState<string[]>([]);
  const [replacementPercentage, setReplacementPercentage] = useState(10);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    skipHeaders: true,
    skipTables: true,
    sectionTailMode: false,
    tailSkipAmount: 50,
  });
  
  const [processedArticle, setProcessedArticle] = useState('');
  const [processingStats, setProcessingStats] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'processed'>('original');

  const previewSectionRef = useRef<HTMLDivElement>(null);

  const handleLoadDemo = useCallback((demoData: {
    articleText: string;
    mainKeyword: string;
    variants: KeywordVariant[];
    exclusionKeywords: string[];
    percentage: number;
  }) => {
    setArticleText(demoData.articleText);
    setMainKeyword(demoData.mainKeyword);
    setKeywordVariants(demoData.variants);
    setExclusionKeywords(demoData.exclusionKeywords);
    setReplacementPercentage(demoData.percentage);
    
    setProcessedArticle('');
    setProcessingStats(null);
    setActiveTab('original');
  }, []);

  const handleProcess = useCallback(async () => {
    if (!articleText.trim() || !mainKeyword.trim() || keywordVariants.length === 0) {
      alert('Please provide article text, main keyword, and at least one variant.');
      return;
    }

    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const processor = new KeywordProcessor();
      const result = processor.processArticle(
        articleText,
        mainKeyword,
        keywordVariants,
        replacementPercentage,
        exclusionKeywords,
        processingOptions
      );
      
      setProcessedArticle(result.processedText);
      setProcessingStats(result);
      setActiveTab('processed');
      
      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error('Processing error:', error);
      alert('An error occurred during processing. Please check your inputs and try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [articleText, mainKeyword, keywordVariants, replacementPercentage, exclusionKeywords, processingOptions]);

  const handleCopyOriginal = useCallback(() => {
    navigator.clipboard.writeText(articleText).then(() => {
      // Success feedback could be added here
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }, [articleText]);

  const handleCopyProcessed = useCallback(() => {
    navigator.clipboard.writeText(processedArticle).then(() => {
      // Success feedback could be added here
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }, [processedArticle]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([processedArticle], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-article.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedArticle]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          {/* Creative Header */}
          <div className="relative mb-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-slate-800 opacity-90"></div>
            <div className="absolute inset-0 bg-slate-800/20"></div>
            
            {/* Floating Particles Effect */}
            <div className="absolute top-4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
            <div className="absolute bottom-6 left-1/3 w-3 h-3 bg-white/20 rounded-full animate-bounce"></div>
            
            {/* Main Content */}
            <div className="relative z-10 backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl mx-4 p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Logo with Glow Effect */}
                {/* Logo */}
                <div>
                  <img 
                    src="/fishtail-logo.png" 
                    alt="Logo" 
                    className="h-16 w-auto hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Text Content */}
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-white bg-clip-text text-transparent">
                      Markdown
                    </span>
                    <span className="text-white"> Keyword </span>
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-white bg-clip-text text-transparent">
                      Replacer
                    </span>
                  </h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-white/90 font-medium tracking-wide">
                      AI-Powered Content Enhancement
                    </p>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Accent Line */}
              <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Demo */}
            <div>
              <h3 className="section-header">Demo</h3>
              <DemoTester onLoadDemo={handleLoadDemo} />
            </div>

            {/* Main Settings */}
            <div>
              <h3 className="section-header">Main Settings</h3>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Keyword
                  </label>
                  <input
                    type="text"
                    value={mainKeyword}
                    onChange={(e) => setMainKeyword(e.target.value)}
                    placeholder="Enter keyword to replace"
                    className="input-field"
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Replacement Percentage: {replacementPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={replacementPercentage}
                    onChange={(e) => setReplacementPercentage(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Processing Options */}
            <div>
              <h3 className="section-header">Options</h3>
              <ProcessingSettings options={processingOptions} onChange={setProcessingOptions} />
            </div>
          </div>

          {/* Variants and Exclusions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <KeywordVariantInput variants={keywordVariants} onChange={setKeywordVariants} />
            </div>
            <div>
              <ExclusionKeywords keywords={exclusionKeywords} onChange={setExclusionKeywords} />
            </div>
          </div>
        </div>

        {/* Article Input */}
        <div className="card p-6 mb-6">
          <h2 className="section-header">Article Content</h2>
          <div className="relative">
            <textarea
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste your markdown content here..."
              className="input-field h-48 resize-none font-mono text-sm"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {articleText.length} characters
            </div>
          </div>
        </div>

        {/* Process Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleProcess}
            disabled={isProcessing || !articleText.trim() || !mainKeyword.trim() || keywordVariants.length === 0}
            className="btn-primary px-8 py-3 text-lg"
          >
            {isProcessing ? 'Processing...' : 'Process Article'}
          </button>
        </div>

        {/* Results */}
        {(processedArticle || processingStats) && (
          <div ref={previewSectionRef} className="space-y-6">
            {/* Stats */}
            {processingStats && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ProcessingStats stats={processingStats} />
                <ReplacedWordsList stats={processingStats} mainKeyword={mainKeyword} />
              </div>
            )}

            {/* Preview */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h2 className="section-header mb-0">Preview</h2>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('original')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'original'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setActiveTab('processed')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'processed'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      disabled={!processedArticle}
                    >
                      Processed
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="btn-secondary"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Raw' : 'Preview'}
                  </button>
                  
                  {activeTab === 'original' && articleText && (
                    <button onClick={handleCopyOriginal} className="btn-secondary">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </button>
                  )}
                  
                  {processedArticle && activeTab === 'processed' && (
                    <>
                      <button onClick={handleCopyProcessed} className="btn-secondary">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </button>
                      <button onClick={handleDownload} className="btn-primary">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto border">
                {activeTab === 'original' ? (
                  showPreview ? (
                    <MarkdownRenderer content={articleText || 'No content to preview'} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                      {articleText || 'No content to display'}
                    </pre>
                  )
                ) : (
                  showPreview ? (
                    <MarkdownRenderer content={processedArticle || 'No processed content to preview'} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                      {processedArticle || 'No processed content to display'}
                    </pre>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;