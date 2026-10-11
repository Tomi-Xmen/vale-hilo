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

## Arquitectura

Monolito modular: un solo backend y un solo frontend, divididos **por dominio**
(auth, servicios, reservas, pagos) en vez de por tipo de archivo. Cada dominio vive
en su carpeta en ambos lados, así que una funcionalidad se encuentra y se cambia en un solo lugar.

```
backend/
  app/
    __init__.py           create_app(): config, extensiones y Blueprints
    config.py             configuración por entorno (development / testing / production)
    extensions.py         instancias compartidas (db, migrate)
    modules/
      __init__.py         lista de Blueprints registrados bajo /api
      health/             GET /api/health
      servicios/          GET /api/servicios
      reservas/           (pendiente)
  migrations/             migraciones de Alembic (Flask-Migrate)
  tests/
    conftest.py           fixtures globales (app, client)
    modules/<dominio>/    tests de cada módulo, mismo árbol que app/modules
frontend/src/
  main.tsx                punto de entrada
  app/                    router, providers globales (TanStack Query) y layout
  features/<dominio>/     api.ts + componentes, hooks y páginas del dominio
  lib/                    cliente HTTP y utilidades sin dominio (formato de precios, etc.)
docker-compose.yml        Postgres, backend y frontend para desarrollo
.env.example              variables de entorno necesarias (copiar a .env)
```

### Un módulo del backend

Agregá solo los archivos que hagan falta, en este orden de dependencia:

```
modules/reservas/
  routes.py      Blueprint: HTTP in/out, valida con schemas, llama al service
  schemas.py     modelos Pydantic de entrada y salida
  service.py     reglas de negocio; único lugar que hace commit
  models.py      modelos SQLAlchemy
  <externo>.py   adaptador a servicios externos (ej. pagos/webpay.py)
```

Después registrá el Blueprint en `app/modules/__init__.py`.

### Una feature del frontend

```
features/reservas/
  api.ts             tipos y llamadas HTTP (usa lib/http)
  hooks.ts           useQuery / useMutation del dominio
  ReservaForm.tsx    componentes del dominio
  ReservasPage.tsx   página que se monta en app/router.tsx
```

### Reglas de dependencia

- `routes → service → models`. Las rutas no tocan la base de datos directamente.
- Un módulo usa otro **solo a través de su `service.py`** (ej. `pagos` llama a
  `reservas.service`), nunca importando sus rutas.
- `lib/` no importa nada de `features/`.
- Una feature del frontend no importa archivos internos de otra; lo compartido se mueve
  a `lib/` (o a `components/ui/` cuando haya componentes visuales reutilizables).
