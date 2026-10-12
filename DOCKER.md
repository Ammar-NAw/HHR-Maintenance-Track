# Run the dashboard with Docker

The image builds the Vite app with Node.js, then serves `dist` with Nginx. Nginx runs as the unprivileged `nginx` user and listens on port 8080 inside the container. Compose publishes that as http://localhost:8089. Excel files stay in the browser: choosing a workbook never sends it to the container.

## Build

```bash
docker compose build
```

## Run

```bash
docker compose up -d
```

Open http://localhost:8089

## Stop

```bash
docker compose down
```

## Rebuild

Use this after dependency or source changes:

```bash
docker compose up -d --build
```

## Test

1. Open http://localhost:8089 and confirm the dashboard layout loads, including the header image.
2. Open http://localhost:8089/not-a-route and confirm the same dashboard loads.
3. Choose **Upload Excel** and open a normal monthly workbook. The sheets should fill the dashboard the same way they do under `npm run dev`.
4. Change the reporting-period selector and confirm the displayed month changes.
