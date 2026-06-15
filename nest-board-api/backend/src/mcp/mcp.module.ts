import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

@Module({
  controllers: [McpController],
  exports: [McpService],
  imports: [AuthModule],
  providers: [McpService],
})
export class McpModule {}
