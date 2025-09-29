@echo off
echo 🚀 Setting up AIMS Docker Environment...

REM Create .env files if they don't exist
if not exist ".\server\.env" (
    echo 📝 Creating server/.env from .env.example...
    copy ".\server\.env.example" ".\server\.env"
)

if not exist ".\client\.env.local" (
    echo 📝 Creating client/.env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost/api > ".\client\.env.local"
)

echo 🔨 Building Docker containers...
docker-compose build

echo 🚀 Starting services...
docker-compose up -d database

echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo 📦 Installing Laravel dependencies...
docker-compose exec backend composer install

echo 🔑 Generating Laravel application key...
docker-compose exec backend php artisan key:generate

echo 🗄️ Running database migrations...
docker-compose exec backend php artisan migrate

echo 📦 Installing frontend dependencies...
docker-compose exec frontend npm install

echo 🚀 Starting all services...
docker-compose up -d

echo ✅ Setup complete! Your application should be available at:
echo    🌐 Frontend: http://localhost
echo    🔧 Backend API: http://localhost/api
echo    🗄️ Database: localhost:3306
echo.
echo 📊 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
pause
