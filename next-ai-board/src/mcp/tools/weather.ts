import type { McpToolDefinition } from "../types";

type WeatherToolArguments = {
  location?: string;
};

type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[];
};

type OpenMeteoGeocodingResult = {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

type OpenMeteoForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  current_units?: {
    temperature_2m?: string;
    apparent_temperature?: string;
    relative_humidity_2m?: string;
    wind_speed_10m?: string;
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
    public readonly code:
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "EXTERNAL_API_ERROR",
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
    "지역명을 받아 Open-Meteo에서 현재 날씨를 조회하고 게시글 초안에 쓸 수 있는 브리핑을 반환합니다.",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "조회할 지역입니다. 예: Seoul",
      },
    },
    required: ["location"],
  },
};

function readWeatherConfig() {
  return {
    defaultLocation: process.env.OPEN_METEO_DEFAULT_LOCATION?.trim() || "Seoul",
    language: process.env.OPEN_METEO_LANGUAGE?.trim() || "ko",
  };
}

function parseLocation(argumentsValue: unknown): string {
  const args = argumentsValue as WeatherToolArguments | undefined;
  const fallbackLocation = readWeatherConfig().defaultLocation;
  const location =
    typeof args?.location === "string" ? args.location.trim() : fallbackLocation;

  if (!location) {
    throw new McpToolError("지역을 입력하세요. 예: Seoul", "INVALID_INPUT");
  }

  if (location.length < 2) {
    throw new McpToolError("지역명은 2자 이상 입력하세요.", "INVALID_INPUT");
  }

  if (location.length > 80) {
    throw new McpToolError(
      "지역명은 80자 이하로 입력하세요.",
      "INVALID_INPUT",
    );
  }

  return location;
}

function getDisplayLocation(geo: OpenMeteoGeocodingResult, fallback: string) {
  const parts = [geo.name, geo.admin1, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : fallback;
}

function formatValue(value: number | null, unit = "") {
  if (value === null) {
    return "알 수 없음";
  }

  return `${Math.round(value)}${unit}`;
}

function getWeatherDescription(weatherCode: number | null) {
  if (weatherCode === null) {
    return "날씨 정보 없음";
  }

  if (weatherCode === 0) {
    return "맑음";
  }

  if ([1, 2, 3].includes(weatherCode)) {
    return "대체로 흐림";
  }

  if ([45, 48].includes(weatherCode)) {
    return "안개";
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return "이슬비";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "비";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "눈";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "뇌우";
  }

  return "날씨 정보 있음";
}

function createWeatherBriefing(
  location: string,
  geo: OpenMeteoGeocodingResult,
  forecast: OpenMeteoForecastResponse,
): WeatherBriefing {
  const displayLocation = getDisplayLocation(geo, location);
  const current = forecast.current;
  const units = forecast.current_units;
  const temperature = current?.temperature_2m ?? null;
  const feelsLike = current?.apparent_temperature ?? null;
  const humidity = current?.relative_humidity_2m ?? null;
  const windSpeed = current?.wind_speed_10m ?? null;
  const weatherCode = current?.weather_code ?? null;
  const description = getWeatherDescription(weatherCode);
  const tempUnit = units?.temperature_2m ?? "°C";
  const feelsLikeUnit = units?.apparent_temperature ?? "°C";
  const humidityUnit = units?.relative_humidity_2m ?? "%";
  const windUnit = units?.wind_speed_10m ?? "km/h";
  const summary = `${displayLocation} 현재 날씨는 ${description}, 기온은 ${formatValue(
    temperature,
    tempUnit,
  )}입니다.`;
  const draft = [
    `오늘의 날씨 브리핑: ${displayLocation}`,
    "",
    summary,
    `체감 온도는 ${formatValue(feelsLike, feelsLikeUnit)}이고 습도는 ${formatValue(
      humidity,
      humidityUnit,
    )}입니다.`,
    windSpeed === null ? "" : `풍속은 ${formatValue(windSpeed, windUnit)}입니다.`,
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
    condition: weatherCode === null ? "unknown" : String(weatherCode),
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
      "Open-Meteo API 호출에 실패했습니다.",
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

  const geocodingUrl = new URL(
    "https://geocoding-api.open-meteo.com/v1/search",
  );
  geocodingUrl.searchParams.set("name", location);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", config.language);
  geocodingUrl.searchParams.set("format", "json");

  const geocoding = await fetchJson<OpenMeteoGeocodingResponse>(geocodingUrl);
  const geo = geocoding.results?.[0];

  if (
    !geo ||
    typeof geo.latitude !== "number" ||
    typeof geo.longitude !== "number"
  ) {
    throw new McpToolError(
      "지역을 찾을 수 없습니다. Seoul처럼 입력해 주세요.",
      "NOT_FOUND",
      { location },
    );
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(geo.latitude));
  forecastUrl.searchParams.set("longitude", String(geo.longitude));
  forecastUrl.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
  );
  forecastUrl.searchParams.set("timezone", geo.timezone || "auto");

  const forecast = await fetchJson<OpenMeteoForecastResponse>(forecastUrl);

  return createWeatherBriefing(location, geo, forecast);
}
