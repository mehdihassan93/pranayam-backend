import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { DiscoveryModule } from "./discovery/discovery.module";

import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>("MONGO_URI") ||
          "mongodb://localhost:27017/pranayam",
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DiscoveryModule,
    ChatModule,
  ],
})
export class AppModule {}
