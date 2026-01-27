import { JwtService } from "@nestjs/jwt";
import * as fs from "fs";

/**
 * UTILITY: Generate test tokens for Artillery Load Testing.
 * This ensures our load tests can bypass the WsJwtGuard
 * by providing valid payloads.
 */
async function generateTestTokens() {
  const jwtService = new JwtService({
    secret: "your_super_secret_key_12345", // Must match .env
    signOptions: { expiresIn: "1h" },
  });

  const users: string[] = [];
  for (let i = 1; i <= 500; i++) {
    const userId = `test_user_id_${i}`;
    const token = jwtService.sign({
      sub: userId,
      phoneNumber: `910000000${i}`,
    });
    users.push(`${userId},${token}`);
  }

  fs.writeFileSync(
    "./test/load-test/users.csv",
    "userId,token\n" + users.join("\n"),
  );
  console.log("✅ Generated 500 test tokens in test/load-test/users.csv");
}

generateTestTokens();
