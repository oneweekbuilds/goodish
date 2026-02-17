# Testing Strategy and Test Plan (#30-33)

This document outlines the recommended test coverage for AlgorithmLens frontend.

## Current Testing

- **Smoke Tests**: `tests/dashboard-smoke.spec.js` using Playwright
- **CLI**: `npm run test:smoke` runs E2E tests

## Recommended Test Files to Create

### 1. Unit Tests

#### Authentication (`tests/unit/auth.test.js`)
- `useAuth` hook loads session
- Magic link sign-in flow
- Sign out clears session
- Token refresh handling

#### Data Parsing (`tests/unit/dataParsing.test.js`)
- `detectScanSource()` correctly identifies desktop vs mobile
- `getDisplayData()` extracts metrics correctly
- Handles edge cases (missing fields, null values)
- Support for both old and new data schemas

#### Error Messages (`tests/unit/errorMessages.test.js`)
- `getErrorMessage()` returns user-friendly messages
- HTTP status codes map to correct messages
- Network errors handled gracefully
- Unknown errors have fallback message

#### Platform Config (`tests/unit/platforms.test.js`)
- `getPlatformConfig()` returns correct config for all platforms
- Falls back to default for unknown platform
- All required fields present (name, icon, bgColor, etc.)

### 2. Component Tests

#### Navigation & Routing (`tests/components/Navigation.test.js`)
- Navbar renders correctly
- Links navigate to correct pages
- Auth state affects navigation options

#### Forms (`tests/components/ScanPlatformPage.test.js`)
- File upload accepts valid video formats
- Rejects invalid file types
- Shows upload progress
- Error messages display on failure

#### Results Display (`tests/components/ResultsPage.test.js`)
- Metrics calculate correctly
- Feed items render properly
- Links to detailed views work
- Skeleton loading state appears while loading

#### History (`tests/components/HistoryPage.test.js`)
- Scans list displays all items
- Pagination controls work
- Delete scan confirmation shows
- Empty state displays when no scans

### 3. Integration Tests

#### Auth Flow (`tests/integration/auth-flow.spec.js`)
- User can sign in with magic link
- Session persists across pages
- Sign out clears all data
- Redirects to login when unauthorized

#### Scan Workflow (`tests/integration/scan-workflow.spec.js`)
- User can select platform
- File upload works
- Processing page shows real-time updates
- Results display after completion
- Scan appears in history

#### Data Flow (`tests/integration/data-flow.spec.js`)
- API calls use correct endpoints
- Error responses handled gracefully
- Loading states show/hide appropriately
- Data caching works when expected

### 4. E2E Tests (Playwright)

Expand beyond current smoke tests:

#### Dashboard (`tests/e2e/dashboard.spec.js`)
- Dashboard loads and displays data
- Tab switching works
- Trends panel opens/closes
- Locked features show paywall

#### Scan Lifecycle (`tests/e2e/scan-lifecycle.spec.js`)
- Complete flow: Select → Upload → Process → Results
- Results match uploaded data
- History updates immediately
- Scan can be deleted

#### Responsiveness (`tests/e2e/responsive.spec.js`)
- Mobile layout works
- Touch interactions functional
- Buttons clickable on small screens
- No horizontal scrolling

#### Accessibility (`tests/e2e/accessibility.spec.js`)
- Keyboard navigation works throughout app
- ARIA labels present on interactive elements
- Color contrasts meet WCAG AA
- Screen reader announces key info

### 5. Performance Tests

#### Load Testing (`tests/performance/load.test.js`)
- Rendering 100+ scans in history
- Large scan data doesn't freeze UI
- Pagination improves performance

#### Bundle Analysis (`tests/performance/bundle.test.js`)
- Bundle size within budget
- Code splitting effective
- No duplicate dependencies
- Third-party scripts lazy loaded

## Test Configuration

### Setup (`.test.js` files)

Use Jest or Vitest:
```bash
npm install --save-dev vitest
```

### Example Test Structure

```javascript
// tests/unit/dataParsing.test.js
import { describe, it, expect } from 'vitest';
import { detectScanSource, getDisplayData } from '../../src/lib/dataParsing';

describe('detectScanSource', () => {
  it('detects desktop source from source_type', () => {
    const data = { source_type: 'DESKTOP_EXTENSION' };
    expect(detectScanSource(data)).toBe('desktop');
  });

  it('detects mobile source by default', () => {
    const data = {};
    expect(detectScanSource(data)).toBe('mobile');
  });
});

describe('getDisplayData', () => {
  it('extracts metrics from scan result', () => {
    const data = {
      scan_metadata: { platform: 'instagram' },
      aggregates: { total_feed_items: 50, ad_percentage: 0.2 }
    };
    const result = getDisplayData(data);
    expect(result.platform).toBe('instagram');
    expect(result.totalPosts).toBe(50);
  });
});
```

## Running Tests

```bash
# Run all tests
npm run test

# Run with watch mode
npm run test:watch

# Run specific test file
npm run test -- auth.test.js

# Run with coverage
npm run test:coverage

# Run E2E/smoke tests
npm run test:smoke

# Run smoke tests with UI
npm run test:smoke:ui
```

## CI/CD Integration

GitHub Actions workflow (see `.github/workflows/ci.yml`):

```yaml
- name: Run unit tests
  run: npm run test -- --coverage

- name: Run E2E tests
  run: npm run test:smoke
```

## Coverage Goals

| Category | Target | Why |
|----------|--------|-----|
| Utilities | 90%+ | Critical logic |
| Components | 80%+ | User-facing |
| Pages | 75%+ | Integration tested via E2E |
| Overall | 80%+ | Maintainability |

## Continuous Improvement

1. **Review Coverage**: Monthly audit of coverage reports
2. **Add Tests for Bugs**: Every bug fix includes a regression test
3. **Performance**: Track test execution time, alert if >5min
4. **Flaky Tests**: Investigate and fix any tests that fail intermittently
5. **New Features**: All new features require tests before merge

## Testing Tools & Resources

- **Vitest**: Unit testing (fast, Vite-native)
- **Playwright**: E2E testing (cross-browser)
- **React Testing Library**: Component testing (best practices)
- **Axe DevTools**: Accessibility testing
- **Lighthouse**: Performance metrics
- **Istanbul**: Coverage reporting

## Next Steps

1. Set up Vitest for unit tests
2. Create test files for critical utilities (dataParsing, errorMessages, auth)
3. Expand existing Playwright tests
4. Add accessibility tests
5. Integrate with CI/CD pipeline
6. Monitor coverage and adjust targets
