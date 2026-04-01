CREATE TABLE daily_forecasts (
  forecast_date TEXT PRIMARY KEY,
  max_temperature REAL NOT NULL,
  min_temperature REAL NOT NULL,
  precipitation_sum REAL NOT NULL,
  ingestion_run_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
