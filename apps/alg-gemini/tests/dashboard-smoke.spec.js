import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Dashboard Smoke Test
 * 
 * Tests that all 5 dashboard tabs can be clicked and render without errors.
 * Captures screenshots and console messages for each tab.
 */

const TABS = [
  { id: 'ads', label: 'Ads & Influence' },
  { id: 'politics', label: 'Politics & Worldview' },
  { id: 'patterns', label: 'Patterns in Your Feed' },
  { id: 'creators', label: 'Creators & Voices' },
  { id: 'algorithm', label: 'What Surfaced' },
  { id: 'talk', label: 'Talk to your Algorithm (coming soon)' },
];

test.describe('Dashboard Smoke Test', () => {
  test('should navigate through all tabs without errors', async ({ page, baseURL }) => {
    const testResults = {
      timestamp: new Date().toISOString(),
      baseUrl: baseURL,
      tabs: [],
      consoleMessages: [],
      errors: [],
      warnings: [],
      passed: true,
    };

    // Capture console messages
    page.on('console', (msg) => {
      const message = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      };
      testResults.consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        testResults.errors.push(message);
        testResults.passed = false;
      } else if (msg.type() === 'warning') {
        testResults.warnings.push(message);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
      testResults.errors.push(errorInfo);
      testResults.passed = false;
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for the dashboard to load - look for tab navigation
    await page.waitForSelector('nav[aria-label="Dashboard tabs"]', { timeout: 15000 });
    
    // Wait for all tabs to be visible
    for (const tab of TABS) {
      const tabButton = page.locator(`button[role="tab"]`).filter({ hasText: new RegExp(tab.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      await expect(tabButton.first()).toBeVisible({ timeout: 10000 });
    }
    
    // Wait a bit for any initial data loading
    await page.waitForTimeout(3000);

    // Navigate through each tab
    for (const tab of TABS) {
      const tabResult = {
        id: tab.id,
        label: tab.label,
        visited: false,
        screenshot: null,
        error: null,
      };

      try {
        // Check if navigation is still available (page might have crashed)
        const navExists = await page.locator('nav[aria-label="Dashboard tabs"]').count() > 0;
        if (!navExists) {
          tabResult.error = 'Navigation disappeared - page may have crashed';
          testResults.passed = false;
          testResults.tabs.push(tabResult);
          continue;
        }

        // Find the tab button using a more flexible selector
        const tabButton = page.locator(`button[role="tab"]`).filter({ hasText: new RegExp(tab.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
        
        // Check if tab button exists
        const buttonCount = await tabButton.count();
        if (buttonCount === 0) {
          tabResult.error = `Tab button not found: ${tab.label}`;
          testResults.passed = false;
          testResults.tabs.push(tabResult);
          continue;
        }
        
        await expect(tabButton.first()).toBeVisible({ timeout: 10000 });
        
        // Click the tab
        await tabButton.first().click();
        
        // Wait for tab to become active
        await expect(tabButton.first()).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
        
        // Wait for tab content to be visible (check for tabpanel)
        await page.waitForSelector(`[role="tabpanel"][id="tabpanel-${tab.id}"]`, { timeout: 10000 });
        
        // Wait a bit for content to render
        await page.waitForTimeout(2000);
        
        // Take screenshot
        const screenshotPath = `test-artifacts/dashboard-smoke/tab-${tab.id}-${Date.now()}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        tabResult.screenshot = screenshotPath;
        tabResult.visited = true;

        // Check if tab content is rendered (look for any content in the tabpanel)
        const tabPanel = page.locator(`[role="tabpanel"][id="tabpanel-${tab.id}"]`);
        const hasContent = await tabPanel.count() > 0;
        
        if (!hasContent) {
          tabResult.error = 'Tab panel not found';
          testResults.passed = false;
        }

      } catch (error) {
        tabResult.error = error.message;
        tabResult.visited = false;
        testResults.passed = false;
        
        // Try to take a screenshot even on error
        try {
          const screenshotPath = `test-artifacts/dashboard-smoke/tab-${tab.id}-error-${Date.now()}.png`;
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          });
          tabResult.screenshot = screenshotPath;
        } catch (screenshotError) {
          // Ignore screenshot errors
        }
      }

      testResults.tabs.push(tabResult);
    }

    // Save test report
    const reportPath = join(process.cwd(), 'test-artifacts', 'dashboard-smoke', `report-${Date.now()}.json`);
    mkdirSync(join(process.cwd(), 'test-artifacts', 'dashboard-smoke'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    // Also save a human-readable text report
    const textReport = [
      'Dashboard Smoke Test Report',
      '='.repeat(50),
      `Timestamp: ${testResults.timestamp}`,
      `Base URL: ${testResults.baseUrl}`,
      '',
      'Tabs Visited:',
      ...testResults.tabs.map(t => 
        `  - ${t.label} (${t.id}): ${t.visited ? '✓ PASSED' : '✗ FAILED'}${t.error ? ` - ${t.error}` : ''}`
      ),
      '',
      `Console Messages: ${testResults.consoleMessages.length}`,
      `Errors: ${testResults.errors.length}`,
      `Warnings: ${testResults.warnings.length}`,
      '',
      'Summary:',
      `  Overall Status: ${testResults.passed ? '✓ PASSED' : '✗ FAILED'}`,
      `  Screenshots saved to: test-artifacts/dashboard-smoke/`,
      `  Full report: ${reportPath}`,
    ].join('\n');

    const textReportPath = join(process.cwd(), 'test-artifacts', 'dashboard-smoke', `report-${Date.now()}.txt`);
    writeFileSync(textReportPath, textReport);

    console.log('\n' + textReport);

    // Fail the test if there were errors or if any tab failed
    if (!testResults.passed) {
      throw new Error(`Smoke test failed: ${testResults.errors.length} errors, ${testResults.tabs.filter(t => !t.visited).length} tabs failed`);
    }

    // Also fail if any console errors occurred
    if (testResults.errors.length > 0) {
      throw new Error(`Smoke test failed: ${testResults.errors.length} console errors detected`);
    }
  });
});
