export interface Env {
  weather_db: D1Database; // D1 database binding
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url); // parse request URL

    if (request.method === "POST" && url.pathname === "/ingest") {
      const runId = crypto.randomUUID(); // unique ingestion ID

      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America/Toronto"
      ); // fetch weather API

      if (!response.ok) {
        return new Response("Failed to fetch weather data", { status: 500 }); // API error
      }

      const data = await response.json(); // parse JSON

      const dates = data.daily.time; // dates array
      const maxTemps = data.daily.temperature_2m_max; // max temps
      const minTemps = data.daily.temperature_2m_min; // min temps
      const precipitation = data.daily.precipitation_sum; // precipitation

      for (let i = 0; i < dates.length; i++) {
        await env.weather_db
          .prepare(`
            INSERT OR REPLACE INTO daily_forecasts
            (forecast_date, max_temperature, min_temperature, precipitation_sum, ingestion_run_id)
            VALUES (?, ?, ?, ?, ?)
          `) // SQL insert
          .bind(dates[i], maxTemps[i], minTemps[i], precipitation[i], runId) // bind values
          .run(); // execute query
      }

      return Response.json({ success: true, runId }); // success response
    }

    return new Response("Use POST /ingest", { status: 200 }); // fallback response
  }
};
