/**
 * Weather API helpers for fetching data from backend GraphQL
 */

export async function fetchWeatherData() {
  const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:30101/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { weather { temperature humidity precipitation } }`
    })
  });

  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }

  const json = await response.json();
  return json.data.weather;
}
