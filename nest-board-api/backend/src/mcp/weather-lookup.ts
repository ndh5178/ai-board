import type { ResearchToolResult } from "./research-results";

type WeatherResponse = {
  current?: {
    precipitation?: unknown;
    temperature_2m?: unknown;
    weather_code?: unknown;
    wind_speed_10m?: unknown;
  };
  daily?: {
    precipitation_probability_max?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    time?: unknown;
  };
};

type Location = {
  latitude: number;
  longitude: number;
  name: string;
};

const DEFAULT_OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast";
const LOCATIONS: Location[] = [
  { latitude: 37.5665, longitude: 126.978, name: "서울" },
  { latitude: 35.1796, longitude: 129.0756, name: "부산" },
  { latitude: 33.4996, longitude: 126.5312, name: "제주" },
  { latitude: 35.8714, longitude: 128.6014, name: "대구" },
  { latitude: 36.3504, longitude: 127.3845, name: "대전" },
  { latitude: 35.1595, longitude: 126.8526, name: "광주" },
  { latitude: 37.4563, longitude: 126.7052, name: "인천" },
];

export async function lookupWeather(query: string, locationName?: string): Promise<ResearchToolResult> {
  const location = findLocation(`${locationName ?? ""} ${query}`);
  const url = new URL(process.env.OPEN_METEO_API_URL ?? DEFAULT_OPEN_METEO_API_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,precipitation");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "Asia/Seoul");
  url.searchParams.set("forecast_days", "3");

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo API 요청에 실패했습니다. (${response.status})`);
  }

  const payload = (await response.json()) as WeatherResponse;
  const current = payload.current ?? {};
  const daily = payload.daily ?? {};

  return {
    items: [
      {
        metadata: [
          `현재 ${readNumber(current.temperature_2m)}도`,
          `강수 ${readNumber(current.precipitation)}mm`,
          `바람 ${readNumber(current.wind_speed_10m)}km/h`,
          weatherLabel(readNumber(current.weather_code)),
          `최대 강수확률 ${readFirstNumber(daily.precipitation_probability_max)}%`,
        ],
        source: "Open-Meteo",
        summary: `${location.name} 기준 현재 날씨와 3일 예보입니다. 일정, 모임, 야외 활동 글에 참고할 수 있습니다.`,
        title: `${location.name} 날씨`,
        url: "https://open-meteo.com/",
      },
    ],
    query,
    tool: "weather_lookup",
  };
}

function findLocation(text: string) {
  return LOCATIONS.find((location) => text.includes(location.name)) ?? LOCATIONS[0];
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readFirstNumber(value: unknown) {
  return Array.isArray(value) ? readNumber(value[0]) : readNumber(value);
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "nest-ai-board/0.1",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function weatherLabel(code: number) {
  if (code === 0) {
    return "맑음";
  }

  if ([1, 2, 3].includes(code)) {
    return "구름";
  }

  if ([45, 48].includes(code)) {
    return "안개";
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "비";
  }

  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return "눈";
  }

  if (code >= 95) {
    return "뇌우";
  }

  return "날씨 코드 확인 필요";
}
