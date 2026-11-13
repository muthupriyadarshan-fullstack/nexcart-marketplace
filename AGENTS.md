<laravel-boost-guidelines>
# Laravel Boost Guidelines for NexCart

This application is an enterprise multi-vendor e-commerce marketplace running on Laravel 13 and PHP 8.5+.

## Conventions & Rules
- Follow PSR-12 and Laravel Pint conventions.
- Use explicit return type declarations and type hints for all method parameters.
- For APIs, use Eloquent API Resources and versioned routes (`/api/v1`).
- Run Artisan commands directly (e.g. `php artisan route:list`, `php artisan test`).
- Concurrency & Transactions: Use DB transactions with row-level locking (`lockForUpdate`) for inventory reservation and checkout.
- Testing: Feature and Unit tests using Pest PHP / PHPUnit testing suites.
</laravel-boost-guidelines>
