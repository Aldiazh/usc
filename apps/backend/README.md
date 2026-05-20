# INFO-CLASH Backend

Laravel 12 API for the INFO-CLASH quiz/event platform.

## Stack

- PHP 8.2
- Laravel 12
- PostgreSQL
- Laravel Sanctum for admin auth
- Laravel Reverb for realtime game broadcasts

## Core Backend Areas

- Admin auth: `app/Http/Controllers/Auth`
- Event management: `app/Http/Controllers/Admin/EventController.php`
- Question management: `app/Http/Controllers/Admin/QuestionController.php`
- Participant join/status: `app/Http/Controllers/Participant/ParticipantController.php`
- Gameplay actions: `app/Http/Controllers/Participant/GamePlayController.php`
- Realtime events: `app/Events`

## Local Setup

1. Install backend dependencies:

```bash
composer install
npm install
```

2. Create a local environment file:

```bash
copy .env.example .env
php artisan key:generate
```

3. Ensure PostgreSQL is running and update `.env` if needed.

Default local values in `.env.example` assume:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_DATABASE=info_clash`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=secret`

4. Run migrations and seed the default admin/questions:

```bash
php artisan migrate
php artisan db:seed
```

5. Start the local backend stack:

```bash
composer dev
```

`composer dev` starts:

- Laravel API server on `http://127.0.0.1:8000`
- queue listener
- Reverb websocket server on `ws://127.0.0.1:8080`
- Laravel logs via `pail`
- Vite for backend assets

## Frontend Integration

The frontend expects:

- API base URL: `http://localhost:8000/api`
- Reverb host: `localhost`
- Reverb port: `8080`

If you change backend host or port values, keep the frontend `.env` aligned.

## Default Admin Login

The admin seeder creates:

- Email: `admin@info-clash.com`
- Password: `password`

## Useful Commands

```bash
php artisan test
php artisan migrate:fresh --seed
php artisan queue:listen --tries=1 --timeout=0
php artisan reverb:start --host=127.0.0.1 --port=8080
```
