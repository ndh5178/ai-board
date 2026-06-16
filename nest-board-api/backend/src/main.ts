import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function readAllowedOrigins() {
  const rawValue =
    process.env.FRONTEND_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173";

  return rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigins = readAllowedOrigins();
  const port = Number(process.env.PORT ?? 3001);

  app.enableCors({
    credentials: true,
    origin: frontendOrigins,
  });

  await app.listen(port);
}

void bootstrap();
