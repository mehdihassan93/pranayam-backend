import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import helmet from "helmet";
import cookieParser from "cookie-parser";

/**
 * BOOTSTRAP: Entry point of the Pranayam API.
 * This file orchestrates the initialization, security middleware application,
 * and server startup.
 */
async function bootstrap() {
  // Initialize the Nest application
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("ServerBootstrap");

  // --- SECURITY HARDENING (Apple-Standards) ---

  // 1. HELMET: Automatically sets secure HTTP headers (XSS, HSTS, Sniffing prevention).
  // This is a MUST for any application handling user session data.
  app.use(helmet());

  // 2. CORS: Restrict API access to trusted origins only.
  // In production, ALLOWED_ORIGINS must be set to specific domains.
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  );
  const isProduction = process.env.NODE_ENV === "production";

  app.enableCors({
    origin: allowedOrigins || (isProduction ? false : true), // Reject all in prod if not configured
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Required for secure cookie-based auth if used later
  });

  if (isProduction && !allowedOrigins) {
    logger.warn(
      "WARNING: ALLOWED_ORIGINS not set in production - CORS will reject all requests",
    );
  }

  // 3. COOKIES: Securely parse incoming cookies.
  app.use(cookieParser());

  // 4. GLOBAL VALIDATION: Strict payload enforcement.
  // This prevents 'Mass Assignment' vulnerabilities where a malicious user
  // sends extra fields (e.g., 'isAdmin: true') that weren't expected by the API.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip any fields not explicitly defined in DTOs
      forbidNonWhitelisted: true, // Reject requests that contain unknown fields
      transform: true, // Automatically cast incoming data to DTO classes
    }),
  );

  // 5. VERSIONING: Prefix all routes for future-proofing.
  // This allows running v1 and v2 APIs simultaneously during major updates.
  app.setGlobalPrefix("api/v1");

  // 6. START: Listen on the preferred port or default to 3000.
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`****************************************************`);
  logger.log(`🚀 Pranayam API is live on: http://localhost:${port}/api/v1`);
  logger.log(`🔒 Security Layer: [Helmet, Strict-CORS, DTO-Validation]`);
  logger.log(`****************************************************`);
}

// Execute the bootstrap sequence
bootstrap().catch((err) => {
  console.error("❌ Critical failure during server startup:", err);
  process.exit(1);
});
