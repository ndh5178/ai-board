import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";

@Module({
  controllers: [MeController],
  imports: [AuthModule],
  providers: [MeService],
})
export class MeModule {}
