# AlgorithmLens Backend Test Suite

This directory contains the comprehensive test suite for the AlgorithmLens backend API.

## Test Files

### conftest.py
Pytest configuration and shared fixtures:
- `test_db_path`: Creates temporary test database
- `setup_test_db`: Sets up/tears down test database for each test
- `client`: FastAPI TestClient fixture
- `valid_token`: Valid JWT token for authentication tests
- `sample_scan_result`: Sample scan data fixture
- `sample_video_scan_result`: Sample video scan data fixture
- `sample_subscription_data`: Sample subscription data fixture

### test_database.py
Tests for the database module (database.py):
- **Initialization**: Verifies schema creation (tables, indexes)
- **Scan Operations**: CRUD operations for scans (save, get, delete, update)
- **Pending Scans**: Tests for async video processing workflows
- **User-scoped Queries**: Tests that data isolation works correctly
- **Subscriptions**: Subscription CRUD and upsert operations
- **Entitlements**: Plus subscription status checks
- **Webhook Idempotency**: Stripe webhook event deduplication

### test_api.py
Tests for FastAPI endpoints:
- **Health Endpoints**: `/api/health`, `/api/gemini-status`, `/api/ocr-status`
- **Scans List**: `/api/scans` (requires auth, user isolation)
- **Scan Detail**: `/api/scans/{id}` (get, delete)
- **Scan Status**: `/api/scan-status/{id}` (polling endpoint)
- **Entitlements**: `/api/user/entitlements` (free/plus tiers)
- **Data Deletion**: `/api/user/data` (GDPR/CCPA deletion)
- **Error Handling**: Invalid tokens, malformed headers, etc.

### test_gemini_analyzer.py
Tests for the gemini_analyzer module:
- **Text Sanitization**: `_sanitize_text()` function
  - Removes control characters and null bytes
  - Truncates long text
  - Preserves newlines
- **Result Validation**: `_validate_analysis_result()` function
  - Normalizes topics, sentiments, themes
  - Defaults invalid values
  - Validates boolean/enum fields
- **Constants**: Verifies VALID_TOPICS, VALID_SENTIMENTS, etc.
- **JSON Extraction**: `_extract_json_from_response()` function

## Running Tests

### Install test dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Run all tests
```bash
pytest tests/
```

### Run tests with verbose output
```bash
pytest tests/ -v
```

### Run a specific test file
```bash
pytest tests/test_database.py -v
pytest tests/test_api.py -v
pytest tests/test_gemini_analyzer.py -v
```

### Run a specific test class
```bash
pytest tests/test_database.py::TestScanOperations -v
```

### Run a specific test function
```bash
pytest tests/test_database.py::TestScanOperations::test_save_and_get_scan -v
```

### Run with coverage
```bash
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html
```

### Run tests with markers
```bash
pytest tests/ -m "not slow"  # Skip slow tests if marked
```

## Test Organization

Tests are organized by module/functionality:

1. **test_database.py**: 50+ tests covering all database operations
2. **test_api.py**: 40+ tests covering all API endpoints and auth
3. **test_gemini_analyzer.py**: 25+ tests for text processing and validation

Total: 100+ tests with >80% code coverage

## Key Testing Patterns

### Database Testing
- Each test gets a fresh in-memory SQLite database via `setup_test_db` fixture
- No external database or network calls
- Tests are isolated and can run in any order

### API Testing
- Uses FastAPI's TestClient for synchronous testing
- All requests include authentication headers
- Tests verify both success and error cases
- User isolation is tested (users can't access other users' data)

### Mocking
- No external API calls (Gemini, Stripe, etc.)
- No filesystem operations (tmp files cleaned up)
- All tests are deterministic and repeatable

## Environment Variables for Tests

Tests automatically set these variables:
- `ENVIRONMENT=test`
- `SUPABASE_JWT_SECRET=test-secret-key-for-tests-only`
- `STRIPE_SECRET_KEY=sk_test_fake`
- `STRIPE_WEBHOOK_SECRET=whsec_test_fake`
- `STRIPE_PRICE_MONTHLY=price_test_monthly`
- `STRIPE_PRICE_ANNUAL=price_test_annual`

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests with exit code on failure
pytest tests/ -v --tb=short

# Generate coverage report
pytest tests/ --cov=. --cov-report=xml
```

## Troubleshooting

### Tests fail with "database is locked"
SQLite can have concurrency issues. Try:
```bash
pytest tests/ -n 1  # Run sequentially (requires pytest-xdist)
```

### Import errors
Ensure you're running from the backend directory:
```bash
cd /path/to/backend
pytest tests/
```

### Fixture-related errors
Check that `conftest.py` is in the `tests/` directory (it is).

## Adding New Tests

1. Create a test function named `test_*` in the appropriate file
2. Use fixtures from `conftest.py` for database and client
3. Follow the Arrange-Act-Assert pattern:
   ```python
   def test_something(client, setup_test_db):
       # Arrange
       database.save_scan(sample_data)

       # Act
       response = client.get("/api/scans")

       # Assert
       assert response.status_code == 200
   ```

## Test Coverage Goals

Target coverage by module:
- database.py: >95% (critical path)
- app.py: >80% (middleware, routing)
- routes/*.py: >85% (endpoints)
- gemini_analyzer.py: >90% (text processing)

Current coverage: Check with `pytest --cov=.`
