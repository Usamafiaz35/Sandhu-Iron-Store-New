# Sindhu Iron Store

A full-stack management portal for **Sindhu Iron Store** — track customers, sales, payments, balances, and dashboard summaries in one place.

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript** | Type-safe frontend code |
| **Vite 8** | Dev server & production build |
| **Lucide React** | Icons |
| **CSS3** | Custom styling (Outfit font, light/dark theme) |

### Backend
| Technology | Purpose |
|---|---|
| **Python** | Server runtime |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **Pydantic** | Request/response validation |
| **PyJWT** | JWT authentication |
| **Werkzeug** | Password hashing |
| **python-dotenv** | Environment configuration |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary database |
| **psycopg2** | PostgreSQL driver & connection pooling |

## Features

- Secure login with JWT
- Customer management (add, search, delete)
- Sale & payment ledger per customer
- New transaction entry with inline customer creation
- Dashboard overview with stats and recent activity
- Responsive UI with themed background & footer

## Project Structure

```
Sindhu Iron Store-New/
├── Backend/           # FastAPI app & database layer
│   ├── app.py
│   └── Database/
├── frontend/          # React + Vite client
│   ├── src/
│   └── public/
└── requirements.txt   # Python dependencies
```

## Quick Start

### Backend
```bash
pip install -r requirements.txt
python Backend/Database/db.py        # create tables (first run)
uvicorn Backend.app:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set a `.env` file for the backend (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`, `ALGORITHM`, `JWT_EXPIRY_HOURS`) and `VITE_API_URL` for the frontend.

## Scripts

| Command | Location | Description |
|---|---|---|
| `npm run dev` | `frontend/` | Start dev server (port 3000) |
| `npm run build` | `frontend/` | Production build |
| `uvicorn Backend.app:app` | root | Run API server |

---

© 2026 Sindhu Store
