import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { McpModule } from "../mcp/mcp.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  controllers: [AiController],
  imports: [AuthModule, McpModule],
  providers: [AiService],
})
export class AiModule {}
