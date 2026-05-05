import { LoginDto } from "@/modules/users/dto/login.dto";
import { RegisterDto } from "@/modules/users/dto/register.dto";
import { UsersService } from "@/modules/users/users.service";
import { Prisma, User } from "@generated/prisma/client";
import {
  BadGatewayException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { CookieOptions, Request, Response } from "express";
import { AuthPayload } from "./types/auth-payload.type";
import type { SafeUser } from "./types/safe-user.type";
import { getAppProtocol, getFrontendOrigin } from "@/config/runtime";

type FortyTwoTokenResponse = {
  access_token: string;
};

type FortyTwoMeResponse = {
  id: number;
  login: string;
  email: string | null;
  image?:
    | string
    | {
        link?: string | null;
        versions?: {
          large?: string | null;
          medium?: string | null;
          small?: string | null;
          micro?: string | null;
        };
      }
    | null;
};

@Injectable()
export class AuthService {
  private static readonly OAUTH_42_STATE_COOKIE = "oauth_42_state";
  private static readonly OAUTH_42_TOKEN_URL = "https://api.intra.42.fr/oauth/token";
  private static readonly OAUTH_42_ME_URL = "https://api.intra.42.fr/v2/me";
  private readonly oauthHttpTimeoutMs = Number(
    process.env.OAUTH_HTTP_TIMEOUT_MS || 10000,
  );

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.usersService.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  private sanitizeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  private normalizeOauthUsername(value: string | undefined, fallback: string): string {
    const cleanedValue = value?.trim();
    if (cleanedValue && cleanedValue.length >= 2) {
      return cleanedValue.slice(0, 32);
    }

    const cleanedFallback = fallback.trim();
    if (cleanedFallback.length >= 2) {
      return cleanedFallback.slice(0, 32);
    }

    return `user-${randomUUID().slice(0, 8)}`;
  }

  private async findOrCreateOauthUser(params: {
    providerEmail: string;
    username: string;
    avatarUrl: string | null;
  }): Promise<User> {
    let user = await this.usersService.findUserByEmail(params.providerEmail);

    if (!user) {
      return this.usersService.createUser({
        email: params.providerEmail,
        username: params.username,
        avatar_url: params.avatarUrl,
        password: await bcrypt.hash(randomUUID(), 10),
        createdAt: new Date(),
      });
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (user.username !== params.username) {
      updateData.username = params.username;
    }

    if (params.avatarUrl && user.avatar_url !== params.avatarUrl) {
      updateData.avatar_url = params.avatarUrl;
    }

    if (Object.keys(updateData).length > 0) {
      user = await this.usersService.updateUser({
        where: { id: user.id },
        data: updateData,
      });
    }

    return user;
  }

  private normalizeOauthAvatarUrl(profile: FortyTwoMeResponse): string | null {
    const imageField = profile.image;

    let rawAvatarUrl: string | null = null;

    if (typeof imageField === "string") {
      rawAvatarUrl = imageField;
    } else if (imageField && typeof imageField === "object") {
      rawAvatarUrl =
        imageField.link ||
        imageField.versions?.large ||
        imageField.versions?.medium ||
        imageField.versions?.small ||
        imageField.versions?.micro ||
        null;
    }

    if (!rawAvatarUrl) {
      return null;
    }

    try {
      const url = new URL(rawAvatarUrl);
      if (url.protocol === "http:") {
        url.protocol = "https:";
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  private getCookieSameSite(): NonNullable<CookieOptions["sameSite"]> {
    const configuredSameSite = (process.env.AUTH_COOKIE_SAMESITE || "lax").toLowerCase();

    if (
      configuredSameSite === "lax" ||
      configuredSameSite === "strict" ||
      configuredSameSite === "none"
    ) {
      return configuredSameSite;
    }

    return "lax";
  }

  private getCookieSecure(
    sameSite: NonNullable<CookieOptions["sameSite"]>,
  ): boolean {
    const configuredSecure = process.env.AUTH_COOKIE_SECURE?.toLowerCase();

    if (configuredSecure === "true") {
      return true;
    }

    if (configuredSecure === "false") {
      return sameSite === "none" ? true : false;
    }

    if (sameSite === "none") {
      return true;
    }

    return (
      getFrontendOrigin().startsWith("https://") || getAppProtocol() === "https"
    );
  }

  private getAuthCookieOptions(): CookieOptions {
    const sameSite = this.getCookieSameSite();

    return {
      httpOnly: true,
      path: "/",
      sameSite,
      secure: this.getCookieSecure(sameSite),
    };
  }

  private getOAuth42StateCookieOptions(): CookieOptions {
    return {
      ...this.getAuthCookieOptions(),
      sameSite: "lax",
      maxAge: 10 * 60 * 1000,
    };
  }

  private getOauth42Config(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
  } {
    const clientId = process.env.FT_CLIENT_ID;
    const clientSecret = process.env.FT_CLIENT_SECRET;
    const redirectUri = process.env.FT_REDIRECT_URI;
    const scope = process.env.FT_SCOPE || "public";

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException("42 OAuth is not configured");
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      scope,
    };
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
  }

  private async fetchJsonOrThrow<T>(
    url: string,
    init: RequestInit,
    errorMessage: string,
  ): Promise<T> {
    const timeoutController = new AbortController();
    const timeout = setTimeout(
      () => timeoutController.abort(),
      this.oauthHttpTimeoutMs,
    );

    try {
      const response = await fetch(url, {
        ...init,
        signal: timeoutController.signal,
      });

      if (!response.ok) {
        throw new BadGatewayException(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        throw new BadGatewayException(`${errorMessage} (timeout)`);
      }

      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(errorMessage);
    } finally {
      clearTimeout(timeout);
    }
  }

  getOauth42StartUrl(res: Response): string {
    const config = this.getOauth42Config();
    const state = randomUUID();
    const authorizeUrl = new URL("https://api.intra.42.fr/oauth/authorize");

    authorizeUrl.searchParams.set("client_id", config.clientId);
    authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", config.scope);
    authorizeUrl.searchParams.set("state", state);

    res.cookie(
      AuthService.OAUTH_42_STATE_COOKIE,
      state,
      this.getOAuth42StateCookieOptions(),
    );

    return authorizeUrl.toString();
  }

  clearOauth42State(res: Response): void {
    res.clearCookie(
      AuthService.OAUTH_42_STATE_COOKIE,
      this.getOAuth42StateCookieOptions(),
    );
  }

  async login(user: User, res: Response): Promise<SafeUser> {
    const updatedUser = await this.usersService.updateUser({
      where: { id: user.id },
      data: { status: "online" },
    });

    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    res.cookie("access_token", accessToken, this.getAuthCookieOptions());

    return this.sanitizeUser(updatedUser);
  }

  async register(dto: RegisterDto, res: Response): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.usersService.createUser({
        ...dto,
        password: hashedPassword,
        createdAt: new Date(),
      });

      return this.login(user, res);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }

      throw error;
    }
  }

  async guestLogin(res: Response): Promise<SafeUser> {
    const guestId = randomUUID();
    const user = await this.usersService.createUser({
      email: `guest+${guestId}@guest.local`,
      username: `Guest-${guestId.slice(0, 8)}`,
      password: await bcrypt.hash(randomUUID(), 10),
      createdAt: new Date(),
    });

    return this.login(user, res);
  }

  async loginWithFortyTwo(
    req: Request,
    res: Response,
    code: string,
    state: string,
  ): Promise<SafeUser> {
    const expectedState = req.cookies?.[AuthService.OAUTH_42_STATE_COOKIE];

    if (!expectedState || expectedState !== state) {
      throw new UnauthorizedException("Invalid OAuth state");
    }

    const config = this.getOauth42Config();
    const tokenPayload = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      state,
    });

    const tokenJson = await this.fetchJsonOrThrow<FortyTwoTokenResponse>(
      AuthService.OAUTH_42_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenPayload.toString(),
      },
      "Failed to exchange 42 authorization code",
    );

    if (!tokenJson.access_token) {
      throw new BadGatewayException("42 token response is invalid");
    }

    const profile = await this.fetchJsonOrThrow<FortyTwoMeResponse>(
      AuthService.OAUTH_42_ME_URL,
      {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
      },
      "Failed to fetch 42 profile",
    );

    if (!profile.login) {
      throw new BadGatewayException("42 profile is invalid");
    }

    const providerEmail = `42-${profile.id}@oauth.local`;
    const username = this.normalizeOauthUsername(
      profile.login,
      `FortyTwo-${profile.id}`,
    );
    const avatarUrl = this.normalizeOauthAvatarUrl(profile);
    const user = await this.findOrCreateOauthUser({
      providerEmail,
      username,
      avatarUrl,
    });

    res.clearCookie(
      AuthService.OAUTH_42_STATE_COOKIE,
      this.getOAuth42StateCookieOptions(),
    );

    return this.login(user, res);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.access_token;

    if (token) {
      try {
        const auth = await this.jwtService.verifyAsync<AuthPayload>(token);
        await this.usersService.updateUser({
          where: { id: auth.sub },
          data: { status: "offline" },
        });
      } catch {
        // Ignore invalid or expired cookies and still clear them.
      }
    }

    res.clearCookie("access_token", this.getAuthCookieOptions());
  }

  async getSessionUser(userId: number): Promise<SafeUser> {
    const user = await this.usersService.findUser({ id: userId });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.sanitizeUser(user);
  }

  async getOptionalSessionUser(
    req: Request,
    res: Response,
  ): Promise<SafeUser | null> {
    const token = req.cookies?.access_token;
    if (!token) {
      return null;
    }

    try {
      const auth = await this.jwtService.verifyAsync<AuthPayload>(token);
      const user = await this.usersService.findUser({ id: auth.sub });
      if (!user) {
        res.clearCookie("access_token", this.getAuthCookieOptions());
        return null;
      }

      return this.sanitizeUser(user);
    } catch {
      res.clearCookie("access_token", this.getAuthCookieOptions());
      return null;
    }
  }
}
