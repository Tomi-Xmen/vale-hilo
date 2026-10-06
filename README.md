# agenda-app

App de reservas para un negocio de servicios: el cliente elige un servicio, reserva una fecha y paga un abono con Webpay Plus. PWA para web y celular.

Estado actual: **Fase 0 (esqueleto)**. Solo existe el endpoint de salud y una página que lo muestra.

## Requisitos

- Git 2.x
- Docker Desktop (Docker Engine 24+ y Compose v2.20+)
- Node.js 20+ y npm 10+ (solo para tooling local del editor)
- Python 3.12+ (solo para correr tests y ruff fuera de Docker)

## Levantar el proyecto

```bash
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health → `{"status": "ok", "db": "ok"}`

El frontend llama a `/api` por el proxy de Vite, así que no hace falta CORS.

## Tests y calidad

Backend (dentro del contenedor):

```bash
docker compose exec backend pytest
docker compose exec backend ruff check .
```

Los tests usan SQLite en memoria, así que también corren fuera de Docker:

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate      # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
ruff check .
```

Frontend:

```bash
cd frontend
npm install
npm run lint      # oxlint
npm run format    # prettier
npm run build     # chequeo de tipos + build
```

## Migraciones

```bash
docker compose exec backend flask db migrate -m "descripción"
docker compose exec backend flask db upgrade
```

## Estructura

```
backend/                  API en Flask
  app/__init__.py         create_app(): registra extensiones y Blueprints bajo /api
  app/config.py           configuración por entorno (development / testing / production)
  app/extensions.py       instancias compartidas de db y migrate
  app/common/             utilidades compartidas entre módulos
  app/modules/            un paquete por dominio (routes → service → models)
  app/modules/health/     GET /api/health, verifica la base de datos
  migrations/             migraciones de Alembic (Flask-Migrate)
  tests/                  tests con pytest
frontend/                 React + Vite + TypeScript
  src/app/                router y providers globales (TanStack Query)
  src/features/           un directorio por dominio (api + componentes)
  src/components/ui/      componentes visuales reutilizables
  src/lib/                cliente HTTP y utilidades
docker-compose.yml        Postgres, backend y frontend para desarrollo
.env.example              variables de entorno necesarias (copiar a .env)
```
