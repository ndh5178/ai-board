import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RagModule } from "../rag/rag.module";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

@Module({
  controllers: [McpController],
  imports: [AuthModule, RagModule],
  providers: [McpService],
})
export class McpModule {}
