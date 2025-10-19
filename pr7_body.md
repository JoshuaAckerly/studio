# refactor(requests): ServeFileRequest for video serve endpoint

This PR extracts a dedicated FormRequest, `ServeFileRequest`, to centralize authorization and validation for the
`/api/video-logs/serve` endpoint.

## Changes
- `app/Http/Requests/ServeFileRequest.php` — new FormRequest that:
  - authorizes the endpoint only in `local` or `testing` environments
  - validates the required `path` query parameter as a string
  - provides a specific error message for a missing `path`
- `app/Http/Controllers/VideoLogController.php` — `serve()` now type-hints `ServeFileRequest` and relies on it for
  auth/validation
- Tests:
  - `tests/Unit/ServeFileRequestTest.php` — unit tests for `authorize()`, `rules()` and `messages()`
  - `tests/Feature/VideoLogTest.php` — feature tests: serve endpoint positive (testing env) and negative (production denies)

## Rationale
- Keeps controller code focused on serving content and handling I/O
- Moves environment gating and validation into a testable, reusable Request object
- Makes authorization/validation failure modes explicit (403 vs 404) and easier to test

## How to test locally

Run the full test suite:

```bash
composer test
```

Run feature or unit tests only as needed:

```bash
vendor/bin/phpunit --filter ServeFileRequestTest
vendor/bin/phpunit --filter VideoLogTest
```

## Checklist for reviewers
- [ ] Confirm `ServeFileRequest::authorize()` semantics are aligned with staging/production policy
- [ ] Confirm the `path` validation rule matches expectations
- [ ] Quick review of controller change and new tests
