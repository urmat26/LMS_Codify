#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h db -U codify -d codify > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready"

echo "Running db push..."
npx prisma db push --accept-data-loss

echo "Running seed..."
npx prisma db seed

echo "Starting server..."
exec node dist/index.js
