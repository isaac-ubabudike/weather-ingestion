# Cloudflare Weather Ingestion Pipeline

## Overview

This project implements a **serverless data ingestion pipeline** using Cloudflare services. The pipeline retrieves weather forecast data from the **Open-Meteo API** and stores the processed results in a relational database.

The ingestion process is triggered through an HTTP endpoint exposed by a **Cloudflare Worker**.

Technologies used:

* Cloudflare Workers
* Cloudflare D1
* TypeScript
* Wrangler CLI
* Open-Meteo Forecast API

---

# Architecture

```
Open-Meteo API
      │
      │ HTTP Request
      ▼
Cloudflare Worker (/ingest endpoint)
      │
      │ Fetch + Parse
      ▼
Cloudflare D1 Database
      │
      ▼
Queryable forecast data
```

The Worker serves as the ingestion entrypoint and executes the pipeline logic.

---

# Data Source

Weather data is retrieved from the Open-Meteo Forecast API.

Example request:

```
https://api.open-meteo.com/v1/forecast
?latitude=43.6532
&longitude=-79.3832
&daily=temperature_2m_max,temperature_2m_min,precipitation_sum
&timezone=America/Toronto
```

Location used: **Toronto**

Only **daily forecast data** is processed.

---

# Data Model

The ingestion pipeline writes records into a single relational table.

## Table: `daily_forecasts`

| Column            | Description                              |
| ----------------- | ---------------------------------------- |
| forecast_date     | Date of forecast                         |
| max_temperature   | Maximum daily temperature                |
| min_temperature   | Minimum daily temperature                |
| precipitation_sum | Total daily precipitation                |
| ingestion_run_id  | Unique identifier for each ingestion run |
| created_at        | Timestamp when record was inserted       |

Schema:

```sql
CREATE TABLE daily_forecasts (
  forecast_date TEXT PRIMARY KEY,
  max_temperature REAL NOT NULL,
  min_temperature REAL NOT NULL,
  precipitation_sum REAL NOT NULL,
  ingestion_run_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

# Ingestion Endpoint

The pipeline is triggered via an HTTP endpoint.

```
POST /ingest
```

Example request:

```bash
curl -X POST https://weather-ingestion.<account>.workers.dev/ingest
```

---

# Ingestion Process

The ingestion pipeline performs the following steps:

### 1. Trigger endpoint

A POST request to `/ingest` starts an ingestion run.

### 2. Fetch forecast data

The Worker calls the Open-Meteo API and retrieves daily forecast data.

### 3. Validate response

The API response is checked to ensure the request succeeded.

### 4. Parse forecast records

The Worker extracts:

* forecast dates
* maximum temperature
* minimum temperature
* precipitation totals

### 5. Persist records

Each forecast entry is written to the database.

The pipeline uses:

```
INSERT OR REPLACE
```

to ensure **idempotency**.

This prevents duplicate records when the ingestion job is run multiple times.

---

# Local Development

Start the Worker locally:

```
npm run dev
```

Worker runs at:

```
http://localhost:8787
```

Trigger ingestion locally:

```
curl -X POST http://localhost:8787/ingest
```

---

# Deployment

Deploy the Worker:

```
npm run deploy
```

Example production endpoint:

```
https://weather-ingestion.<account>.workers.dev
```

Trigger ingestion:

```
curl -X POST https://weather-ingestion.<account>.workers.dev/ingest
```

---

# Verifying Data

Query the database:

```
npx wrangler d1 execute weather-db --remote \
--command="SELECT * FROM daily_forecasts;"
```

Example result:

| forecast_date | max_temperature | min_temperature | precipitation_sum |
| ------------- | --------------- | --------------- | ----------------- |
| 2026-03-31    | 13.6            | 5.8             | 24.5              |
| 2026-04-01    | 7.2             | 1.1             | 0                 |

---

# Design Decisions

### Serverless architecture

Cloudflare Workers allow ingestion logic to run without managing infrastructure.

### Idempotent ingestion

Using a **primary key on forecast_date** ensures that multiple ingestion runs do not create duplicate records.

### Run tracking

Each ingestion execution generates an `ingestion_run_id` allowing ingestion events to be traced.

---

# Tradeoffs

**Advantages**

* Simple architecture
* Low operational overhead
* Easily scalable

**Limitations**

* Only latest forecast values are stored
* Historical forecast changes are not tracked

---

# Conclusion

This project demonstrates a **simple, reliable ingestion pipeline** using Cloudflare primitives that retrieves external API data and persists structured records in a relational database.
