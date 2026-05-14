import { ok, type ApiResponse } from "@/common/http/api-response";
import { LoginDto } from "@/modules/users/dto/login.dto";
import { RegisterDto } from "@/modules/users/dto/register.dto";
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SafeUser } from "./types/safe-user.type";
import { resolveFrontendOriginFromRequest } from "@/config/runtime";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<SafeUser>> {
    const user = await this.authService.validateUser(dto);
    return ok(await this.authService.login(user, res));
  }

  @Post("register")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<SafeUser>> {
    return ok(await this.authService.register(dto, res));
  }

  @Post("guest")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async guest(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<SafeUser>> {
    return ok(await this.authService.guestLogin(res));
  }

  @Get("42/start")
  oauth42Start(@Req() req: Request, @Res() res: Response): void {
    const frontendOrigin = resolveFrontendOriginFromRequest(req.headers);

    try {
      res.redirect(this.authService.getOauth42StartUrl(res));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "oauth_42_not_configured";
      res.redirect(
        `${frontendOrigin}/login?oauth_error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Get("42/callback")
  async oauth42Callback(
    @Req() req: Request,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendOrigin = resolveFrontendOriginFromRequest(req.headers);

    if (!code || !state) {
      this.authService.clearOauth42State(res);
      res.redirect(`${frontendOrigin}/login?oauth_error=missing_code_or_state`);
      return;
    }

    try {
      await this.authService.loginWithFortyTwo(req, res, code, state);
      res.redirect(`${frontendOrigin}/`);
    } catch (error) {
      this.authService.clearOauth42State(res);
      const message =
        error instanceof Error ? error.message : "oauth_42_failed";
      this.logger.warn(`OAuth 42 callback failed: ${message}`);
      res.redirect(
        `${frontendOrigin}/login?oauth_error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ loggedOut: true }>> {
    await this.authService.logout(req, res);
    return ok({ loggedOut: true });
  }

  @Get("session")
  async session(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ authenticated: boolean; user: SafeUser | null }>> {
    const user = await this.authService.getOptionalSessionUser(req, res);
    return ok({
      authenticated: user !== null,
      user,
    });
  }
}
