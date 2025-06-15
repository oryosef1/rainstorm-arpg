/**
 * Performance Testing Suite using Lighthouse
 * Automated performance analysis for RainStorm ARPG
 */

import * as fs from 'fs';
import * as path from 'path';
import { launch as launchChrome } from 'chrome-launcher';
import puppeteer, { Browser, Page } from 'puppeteer';

// Lighthouse types
interface LighthouseResult {
  lhr: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
      pwa: { score: number };
    };
  };
  report: string[];
}

interface PerformanceScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

interface GamePerformanceResults {
  initTime: number;
  frameRate: {
    fps: number;
    frameCount: number;
    duration: number;
  };
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  entityPerformance: {
    entitiesCreated: number;
    timeMs: number;
    entitiesPerSecond: number;
  } | null;
}

interface TestSummary {
  timestamp: string;
  lighthouse: PerformanceScores;
  gamePerformance: GamePerformanceResults;
  validationPassed: boolean;
  reportDirectory: string;
}

interface TestResult {
  success: boolean;
  results?: TestSummary;
  error?: string;
}

export class PerformanceTests {
  private gameUrl: string = 'http://localhost:8000';
  private reportDir: string;
  private results: PerformanceScores = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    pwa: 0
  };

  constructor() {
    this.reportDir = path.join(__dirname, 'reports');
  }

  async setup(): Promise<void> {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Run Lighthouse audit
   */
  async runLighthouseAudit(): Promise<PerformanceScores> {
    console.log('🔍 Starting Lighthouse performance audit...');

    const chrome = await launchChrome({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const options = {
      logLevel: 'info' as const,
      output: ['html', 'json'] as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      port: chrome.port,
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      }
    };

    try {
      // Dynamic import for Lighthouse
      const lighthouse = await import('lighthouse');
      const runnerResult: LighthouseResult = await lighthouse.default(this.gameUrl, options);

      // Save reports
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const htmlPath = path.join(this.reportDir, `lighthouse-report-${timestamp}.html`);
      const jsonPath = path.join(this.reportDir, `lighthouse-report-${timestamp}.json`);

      fs.writeFileSync(htmlPath, runnerResult.report[0]);
      fs.writeFileSync(jsonPath, runnerResult.report[1]);

      // Extract scores
      const lhr = runnerResult.lhr;
      this.results = {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        pwa: Math.round(lhr.categories.pwa.score * 100)
      };

      console.log('📊 Lighthouse Results:');
      console.log(`   Performance: ${this.results.performance}/100`);
      console.log(`   Accessibility: ${this.results.accessibility}/100`);
      console.log(`   Best Practices: ${this.results.bestPractices}/100`);
      console.log(`   SEO: ${this.results.seo}/100`);
      console.log(`   PWA: ${this.results.pwa}/100`);

      console.log(`📄 Reports saved to: ${this.reportDir}`);

      await chrome.kill();
      return this.results;

    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }

  /**
   * Custom game performance tests
   */
  async runGamePerformanceTests(): Promise<GamePerformanceResults> {
    console.log('🎮 Running game-specific performance tests...');

    const browser: Browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page: Page = await browser.newPage();

    try {
      // Enable performance monitoring
      await page.goto(this.gameUrl, { waitUntil: 'networkidle0' });

      // Measure game initialization time
      const initTime: number = await page.evaluate(() => {
        const start = performance.now();
        
        return new Promise<number>((resolve) => {
          const checkGameReady = () => {
            if ((window as any).gameState && (window as any).gameState.world) {
              const end = performance.now();
              resolve(end - start);
            } else {
              setTimeout(checkGameReady, 50);
            }
          };
          checkGameReady();
        });
      });

      // Measure frame rate
      const frameRateTest = await page.evaluate(() => {
        return new Promise<{ fps: number; frameCount: number; duration: number }>((resolve) => {
          let frameCount = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frameCount++;
            if (performance.now() - startTime < 5000) {
              requestAnimationFrame(countFrames);
            } else {
              const duration = (performance.now() - startTime) / 1000;
              const fps = frameCount / duration;
              resolve({ fps: Math.round(fps), frameCount, duration });
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });

      // Measure memory usage
      const memoryUsage = await page.evaluate(() => {
        if ((performance as any).memory) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
          };
        }
        return null;
      });

      // Test entity creation performance
      const entityPerformance = await page.evaluate(() => {
        const world = (window as any).gameState?.world;
        if (!world) return null;

        const start = performance.now();
        const entities: any[] = [];
        
        // Create 1000 entities
        for (let i = 0; i < 1000; i++) {
          entities.push(world.createEntity());
        }
        
        const createTime = performance.now() - start;
        
        // Cleanup
        entities.forEach(entity => world.removeEntity(entity.id));
        
        return {
          entitiesCreated: entities.length,
          timeMs: Math.round(createTime),
          entitiesPerSecond: Math.round(entities.length / (createTime / 1000))
        };
      });

      const gamePerformance: GamePerformanceResults = {
        initTime: Math.round(initTime),
        frameRate: frameRateTest,
        memoryUsage,
        entityPerformance
      };

      console.log('🎮 Game Performance Results:');
      console.log(`   Initialization: ${gamePerformance.initTime}ms`);
      console.log(`   Average FPS: ${gamePerformance.frameRate.fps}`);
      console.log(`   Memory Usage: ${gamePerformance.memoryUsage?.usedJSHeapSize || 'N/A'}MB`);
      console.log(`   Entity Creation: ${gamePerformance.entityPerformance?.entitiesPerSecond || 'N/A'} entities/sec`);

      // Save performance data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const perfPath = path.join(this.reportDir, `game-performance-${timestamp}.json`);
      fs.writeFileSync(perfPath, JSON.stringify(gamePerformance, null, 2));

      await browser.close();
      return gamePerformance;

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Validate performance thresholds
   */
  validatePerformance(): boolean {
    console.log('✅ Validating performance thresholds...');

    const thresholds: PerformanceScores = {
      performance: 80,
      accessibility: 90,
      bestPractices: 85,
      seo: 80,
      pwa: 70
    };

    const failures: string[] = [];

    (Object.keys(thresholds) as Array<keyof PerformanceScores>).forEach(category => {
      if (this.results[category] < thresholds[category]) {
        failures.push(`${category}: ${this.results[category]} < ${thresholds[category]}`);
      }
    });

    if (failures.length > 0) {
      console.log('❌ Performance validation failed:');
      failures.forEach(failure => console.log(`   - ${failure}`));
      return false;
    }

    console.log('✅ All performance thresholds met!');
    return true;
  }

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<TestResult> {
    console.log('🚀 Starting Performance Test Suite for RainStorm ARPG');
    console.log('=====================================================');

    await this.setup();

    try {
      const lighthouseResults = await this.runLighthouseAudit();
      const gameResults = await this.runGamePerformanceTests();
      const validationPassed = this.validatePerformance();

      // Create summary report
      const summary: TestSummary = {
        timestamp: new Date().toISOString(),
        lighthouse: lighthouseResults,
        gamePerformance: gameResults,
        validationPassed,
        reportDirectory: this.reportDir
      };

      const summaryPath = path.join(this.reportDir, 'performance-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      console.log('\n📊 Performance Test Summary');
      console.log('===========================');
      console.log(`Overall Status: ${validationPassed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Reports Location: ${this.reportDir}`);

      return { success: validationPassed, results: summary };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Performance test suite failed:', message);
      return { success: false, error: message };
    }
  }
}

// Install dependencies check
function checkDependencies(): boolean {
  try {
    require('lighthouse');
    require('chrome-launcher');
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('❌ Missing dependencies. Install with:');
    console.log('npm install lighthouse chrome-launcher puppeteer');
    return false;
  }
}

// Run tests if called directly
if (typeof require !== 'undefined' && require.main === module) {
  if (!checkDependencies()) {
    process.exit(1);
  }

  const tests = new PerformanceTests();
  tests.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Performance test suite crashed:', error);
      process.exit(1);
    });
}

export { PerformanceTests };