import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import type { JsonRpcRequest } from "./mcp.dto";
import { McpService } from "./mcp.service";

@Controller("mcp")
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post("json-rpc")
  @UseGuards(AuthGuard, AdminGuard)
  handleJsonRpc(@Body() body: JsonRpcRequest) {
    return this.mcpService.handleJsonRpc(body);
  }
}
