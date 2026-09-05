# Edge App

Cloudflare Workers + Hyperdrive + Neon PostgreSQL

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Neon PostgreSQL via Hyperdrive
- **ORM**: Drizzle ORM
- **Deployment**: Cloudflare Workers + GitHub Actions

## Project Structure

```
edge-app/
├── src/
│   ├── index.ts              # Worker entry point
│   └── lib/
│       └── schema.ts         # Database schema
├── migrations/               # Drizzle migrations
├── wrangler.toml             # Cloudflare configuration
├── drizzle.config.ts         # Drizzle ORM configuration
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/api/posts` | List all posts |
| GET | `/api/users` | List all users |
| POST | `/api/posts` | Create a new post |

## Getting Started

### Prerequisites

- Node.js 20+
- Cloudflare account
- Neon PostgreSQL database
- Wrangler CLI

### Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure wrangler.toml with your Hyperdrive ID

3. Run development server:
   ```bash
   npm run dev
   ```

4. Test the API:
   ```bash
   curl http://localhost:8787/health
   curl http://localhost:8787/api/posts
   ```

## Deployment

### Cloudflare Workers

```bash
npm run deploy
```

### GitHub Actions

Push to main branch triggers automatic deployment.

Required secrets:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers edit permission

## Hyperdrive Configuration

Hyperdrive ID: `0c21810abc534c9681658adfee47789c`

Connection string (stored in Cloudflare):
```
postgresql://neondb_owner:npg_rWOvA5QU9pFe@ep-square-boat-auqrsoiu-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Production Features

- **Edge Computing**: Runs on 300+ Cloudflare edge locations
- **Hyperdrive**: Connection pooling and caching for PostgreSQL
- **Low Latency**: Sub-1ms cold start times
- **Auto Scaling**: Handles traffic spikes automatically

## License

MIT
