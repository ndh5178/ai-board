import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  const port = Number(process.env.PORT ?? 3001);

  app.enableCors({
    credentials: true,
    origin: frontendOrigin,
  });

  await app.listen(port);
}

void bootstrap();
