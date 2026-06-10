import type { McpToolDefinition } from "../types";

type WeatherToolArguments = {
  location?: string;
};

type GeocodingResult = {
  name?: string;
  lat?: number;
  lon?: number;
  country?: string;
  state?: string;
};

type CurrentWeatherResult = {
  name?: string;
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  weather?: Array<{
    main?: string;
    description?: string;
  }>;
  wind?: {
    speed?: number;
  };
};

export type WeatherBriefing = {
  location: string;
  displayLocation: string;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  condition: string;
  description: string;
  summary: string;
  draft: string;
};

export class McpToolError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_INPUT" | "MISSING_API_KEY" | "NOT_FOUND" | "EXTERNAL_API_ERROR",
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export const weatherCurrentTool: McpToolDefinition = {
  name: "weather_current",
  title: "현재 날씨 조회",
  description:
    "지역명을 받아 OpenWeather에서 현재 날씨를 조회하고 게시글 초안에 쓸 수 있는 브리핑을 반환합니다.",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "조회할 지역입니다. 예: Seoul,KR",
      },
    },
    required: ["location"],
  },
};

function readWeatherConfig() {
  return {
    apiKey: process.env.OPENWEATHER_API_KEY?.trim() ?? "",
    defaultLocation:
      process.env.OPENWEATHER_DEFAULT_LOCATION?.trim() || "Seoul,KR",
    units: process.env.OPENWEATHER_UNITS?.trim() || "metric",
    lang: process.env.OPENWEATHER_LANG?.trim() || "kr",
  };
}

function parseLocation(argumentsValue: unknown): string {
  const args = argumentsValue as WeatherToolArguments | undefined;
  const fallbackLocation = readWeatherConfig().defaultLocation;
  const location =
    typeof args?.location === "string" ? args.location.trim() : fallbackLocation;

  if (!location) {
    throw new McpToolError(
      "지역을 입력하세요. 예: Seoul,KR",
      "INVALID_INPUT",
    );
  }

  if (location.length > 80) {
    throw new McpToolError(
      "지역명은 80자 이하로 입력하세요.",
      "INVALID_INPUT",
    );
  }

  return location;
}

function getDisplayLocation(geo: GeocodingResult, fallback: string) {
  const parts = [geo.name, geo.state, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : fallback;
}

function formatTemperature(value: number | null) {
  return value === null ? "알 수 없음" : `${Math.round(value)}도`;
}

function createWeatherBriefing(
  location: string,
  geo: GeocodingResult,
  weather: CurrentWeatherResult,
): WeatherBriefing {
  const displayLocation = getDisplayLocation(geo, location);
  const temperature = weather.main?.temp ?? null;
  const feelsLike = weather.main?.feels_like ?? null;
  const humidity = weather.main?.humidity ?? null;
  const windSpeed = weather.wind?.speed ?? null;
  const condition = weather.weather?.[0]?.main ?? "Unknown";
  const description = weather.weather?.[0]?.description ?? "날씨 정보 없음";
  const summary = `${displayLocation} 현재 날씨는 ${description}, 기온은 ${formatTemperature(
    temperature,
  )}입니다.`;
  const draft = [
    `오늘의 날씨 브리핑: ${displayLocation}`,
    "",
    summary,
    `체감 온도는 ${formatTemperature(feelsLike)}이고 습도는 ${
      humidity === null ? "알 수 없음" : `${humidity}%`
    }입니다.`,
    windSpeed === null ? "" : `풍속은 초속 ${windSpeed}m입니다.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    location,
    displayLocation,
    temperature,
    feelsLike,
    humidity,
    windSpeed,
    condition,
    description,
    summary,
    draft,
  };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new McpToolError(
      "OpenWeather API 호출에 실패했습니다.",
      "EXTERNAL_API_ERROR",
      {
        status: response.status,
        statusText: response.statusText,
      },
    );
  }

  return (await response.json()) as T;
}

export async function getCurrentWeatherBriefing(
  argumentsValue: unknown,
): Promise<WeatherBriefing> {
  const config = readWeatherConfig();
  const location = parseLocation(argumentsValue);

  if (!config.apiKey) {
    throw new McpToolError(
      "OpenWeather API Key가 설정되지 않았습니다.",
      "MISSING_API_KEY",
    );
  }

  const geocodingUrl = new URL("https://api.openweathermap.org/geo/1.0/direct");
  geocodingUrl.searchParams.set("q", location);
  geocodingUrl.searchParams.set("limit", "1");
  geocodingUrl.searchParams.set("appid", config.apiKey);

  const geocodingResults = await fetchJson<GeocodingResult[]>(geocodingUrl);
  const geo = geocodingResults[0];

  if (!geo || typeof geo.lat !== "number" || typeof geo.lon !== "number") {
    throw new McpToolError(
      "지역을 찾을 수 없습니다. Seoul,KR처럼 입력해 주세요.",
      "NOT_FOUND",
      { location },
    );
  }

  const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  weatherUrl.searchParams.set("lat", String(geo.lat));
  weatherUrl.searchParams.set("lon", String(geo.lon));
  weatherUrl.searchParams.set("appid", config.apiKey);
  weatherUrl.searchParams.set("units", config.units);
  weatherUrl.searchParams.set("lang", config.lang);

  const weather = await fetchJson<CurrentWeatherResult>(weatherUrl);

  return createWeatherBriefing(location, geo, weather);
}
