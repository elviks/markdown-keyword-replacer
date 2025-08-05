import React from 'react';
import { Play } from 'lucide-react';
import type { KeywordVariant } from '../types';

interface DemoTesterProps {
  onLoadDemo: (demoData: {
    articleText: string;
    mainKeyword: string;
    variants: KeywordVariant[];
    exclusionKeywords: string[];
    percentage: number;
  }) => void;
}

export const DemoTester: React.FC<DemoTesterProps> = ({ onLoadDemo }) => {
  const handleLoadDemo = () => {
    const demoData = {
      articleText: `# Vigor Now Review 2025: Updated In-Depth Analysis Before You Buy!

Addressing men's health and vitality has never been more important, especially as modern lifestyles, stress, and aging take a toll on energy levels and sexual performance.

| Specification        | Details                                                |
|----------------------|--------------------------------------------------------|
| **Product Name**     | Vigor Now                                             |
| **Category**         | Male Enhancement Supplement                           |
| **Form**             | Capsules                                              |
| **Serving Size**     | 2 capsules daily                                      |

## What is Vigor Now?

Vigor Now is a dietary supplement formulated to enhance male sexual performance, stamina, and overall vitality. The product claims to use natural ingredients to support testosterone levels, improve blood flow, and boost energy.

## How Does Vigor Now Work?

Vigor Now works by leveraging a synergistic blend of herbal extracts and amino acids to support key aspects of male sexual health.

## Our Review Process

Our evaluation of Vigor Now involved a comprehensive review process, including ingredient analysis, customer feedback examination, and comparison with similar products in the market.

## Ingredient Quality and Sourcing

Vigor Now's formula is anchored by clinically studied, high-quality ingredients sourced for purity and potency.

## Final Verdict

Vigor Now provides a comprehensive solution for men seeking to enhance their sexual health and overall vitality.

## Overall Assessment

Vigor Now stands out for its natural, research-backed formula and high customer satisfaction. However, individual results may vary, and it's important to maintain realistic expectations.

## Customer Testimonials

The reputation of Vigor Now is built on a foundation of positive customer experiences and transparent business practices.

### Real User Reviews from Various Platforms

**Source: Reddit (www.reddit.com)**
> "I was skeptical at first, but after using Vigor Now for a month, I noticed significant improvements in my energy levels and performance. Highly recommend!"

**Source: Trustpilot (www.trustpilot.com)**
> "Vigor Now reviews were spot on. My performance has improved, and I feel more confident overall."

**Source: Quora (www.quora.com)**
> "I've tried several male enhancement supplements, but Vigor Now stands out for its natural approach and effectiveness."

**Source: Facebook (www.facebook.com)**
> "I bought Vigor Now after reading a detailed Vigor Now review online. The results have been impressive!"

**Source: X (formerly Twitter)**
> "Wasn't sure if Vigor Now was a scam, but it's definitely legit. The energy boost is real!"

**Source: Reddit (www.reddit.com)**
> "I've struggled with low energy for years. Vigor Now has helped me regain my vitality and confidence."

**Source: Trustpilot (www.trustpilot.com)**
> "I appreciate the honest Vigor Now reviews online. The supplement delivers on its promises."`,
      mainKeyword: 'Vigor Now',
      variants: [
        { id: '1', text: 'VigorNow', priority: 1 as const },
        { id: '2', text: 'VigorNow Male Enhancement', priority: 2 as const },
        { id: '3', text: 'VigorNow ME', priority: 3 as const },
      ],
      exclusionKeywords: ['Vigor Now is'],
      percentage: 50,
    };

    onLoadDemo(demoData);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">Vigor Now Demo</h4>
          <p className="text-xs text-gray-600">Complete test data</p>
        </div>
        <button
          onClick={handleLoadDemo}
          className="btn-primary text-sm px-3 py-1.5 flex items-center space-x-1"
        >
          <Play className="w-3 h-3" />
          <span>Load</span>
        </button>
      </div>
      <div className="flex space-x-2 text-xs">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
          3 variants
        </span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
          50% replace
        </span>
      </div>
    </div>
  );
};