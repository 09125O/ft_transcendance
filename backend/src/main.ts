import "dotenv/config";
import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import {
  PUBLIC_UPLOADS_PREFIX,
  UPLOADS_ROOT_DIR,
} from "@/modules/users/avatar-storage";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { existsSync, mkdirSync, readFileSync } from "fs";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { getAppProtocol, getFrontendOrigin, isOriginAllowed } from "./config/runtime";

async function bootstrap() {
  const port = Number(process.env.BACKEND_PORT || 4000);
  const frontendOrigin = getFrontendOrigin();
  const appProtocol = getAppProtocol();
  const tlsKeyPath = process.env.TLS_KEY_FILE || "/certs/dev-localhost.key";
  const tlsCertPath = process.env.TLS_CERT_FILE || "/certs/dev-localhost.crt";
  const hasTlsFiles = existsSync(tlsKeyPath) && existsSync(tlsCertPath);
  const shouldUseHttps = appProtocol === "https";

  if (shouldUseHttps && !hasTlsFiles) {
    throw new Error(
      `HTTPS is enabled but TLS files are missing (${tlsKeyPath}, ${tlsCertPath})`,
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    shouldUseHttps
      ? {
          httpsOptions: {
            key: readFileSync(tlsKeyPath),
            cert: readFileSync(tlsCertPath),
          },
        }
      : undefined,
  );

  app.enableCors({
    credentials: true,
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
  app.use(cookieParser());
  mkdirSync(UPLOADS_ROOT_DIR, { recursive: true });
  app.useStaticAssets(UPLOADS_ROOT_DIR, {
    prefix: PUBLIC_UPLOADS_PREFIX,
  });

  await app.listen(port, "0.0.0.0");
  console.log(
    `Backend listening on ${appProtocol}://0.0.0.0:${port} (frontend origin: ${frontendOrigin})`,
  );
}

void bootstrap();
