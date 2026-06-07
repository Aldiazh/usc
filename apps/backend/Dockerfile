FROM docker.io/library/php:8.2-cli

# Install system dependencies dan library untuk PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (termasuk pdo_pgsql untuk PostgreSQL)
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Install PHP Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=docker.io/library/composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
