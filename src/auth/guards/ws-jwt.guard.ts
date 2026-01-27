import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        this.logger.error("No token found in WS connection");
        throw new WsException("Unauthorized");
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      // Attach user to client for later use
      client["user"] = payload;
      return true;
    } catch (err) {
      this.logger.error(`WS Auth failed: ${err.message}`);
      throw new WsException("Unauthorized");
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check Authorization header first, then query string
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    return client.handshake.query?.token as string;
  }
}
