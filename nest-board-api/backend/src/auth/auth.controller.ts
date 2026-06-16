import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import type { ChangePasswordBody, DeleteAccountBody, LoginBody, SignupBody } from "./auth.dto";
import type { AuthUser } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() body: SignupBody) {
    return this.authService.signup(body);
  }

  @Post("login")
  login(@Body() body: LoginBody) {
    return this.authService.login(body);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user);
  }

  @Patch("password")
  @UseGuards(AuthGuard)
  changePassword(@Body() body: ChangePasswordBody, @CurrentUser() user: AuthUser) {
    return this.authService.changePassword(body, user);
  }

  @Delete("me")
  @UseGuards(AuthGuard)
  deleteAccount(@Body() body: DeleteAccountBody, @CurrentUser() user: AuthUser) {
    return this.authService.deleteAccount(body, user);
  }

  @Post("logout")
  logout() {
    return {
      message: "프론트엔드에서 accessToken을 삭제하면 로그아웃됩니다.",
      ok: true,
    };
  }
}
