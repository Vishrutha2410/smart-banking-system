// Fails fast with a clear message instead of letting the app run with
// undefined secrets (which previously caused cryptic errors like
// "secretOrPrivateKey must have a value" deep inside jsonwebtoken).
const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET", "ADMIN_REGISTRATION_CODE"];

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length > 0) {
    console.error("=".repeat(60));
    console.error("[Startup Error] Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("");
    console.error("Copy .env.example to .env and fill in real values before starting the server.");
    console.error("=".repeat(60));
    process.exit(1);
  }

  if (process.env.JWT_SECRET === "replace_with_a_secure_secret") {
    console.error("[Startup Error] JWT_SECRET is still set to the placeholder value.");
    console.error("Set a real, random secret in .env before starting the server.");
    process.exit(1);
  }
};
