/// <reference types="jest" />

import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("throws on unknown email", async () => {
    const usersService = {
      findUserByEmail: jest.fn().mockResolvedValue(null),
    } as any;
    const jwtService = {} as any;
    const service = new AuthService(usersService, jwtService);

    await expect(
      service.validateUser({ email: "missing@test.com", password: "secret" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("returns user on valid credentials", async () => {
    const password = "strong-password";
    const hashedPassword = await bcrypt.hash(password, 10);
    const expectedUser = {
      id: 1,
      email: "user@test.com",
      username: "user",
      password: hashedPassword,
      status: "online",
      avatar_url: null,
      createdAt: new Date(),
    };

    const usersService = {
      findUserByEmail: jest.fn().mockResolvedValue(expectedUser),
    } as any;
    const jwtService = {} as any;
    const service = new AuthService(usersService, jwtService);

    await expect(
      service.validateUser({ email: expectedUser.email, password }),
    ).resolves.toMatchObject({ id: expectedUser.id, email: expectedUser.email });
  });

  it("throws on invalid password", async () => {
    const user = {
      id: 2,
      email: "user@test.com",
      username: "user",
      password: await bcrypt.hash("right-password", 10),
      status: "online",
      avatar_url: null,
      createdAt: new Date(),
    };

    const usersService = {
      findUserByEmail: jest.fn().mockResolvedValue(user),
    } as any;
    const jwtService = {} as any;
    const service = new AuthService(usersService, jwtService);

    await expect(
      service.validateUser({ email: user.email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("sets session cookie and returns sanitized user on login", async () => {
    const updatedUser = {
      id: 3,
      email: "login@test.com",
      username: "login-user",
      password: "hashed",
      status: "online",
      avatar_url: null,
      createdAt: new Date(),
    };

    const usersService = {
      updateUser: jest.fn().mockResolvedValue(updatedUser),
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue("jwt-token"),
    } as any;
    const service = new AuthService(usersService, jwtService);

    const response = {
      cookie: jest.fn(),
    } as any;

    const result = await service.login(updatedUser as any, response);

    expect(usersService.updateUser).toHaveBeenCalledWith({
      where: { id: updatedUser.id },
      data: { status: "online" },
    });
    expect(jwtService.signAsync).toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    });
    expect((result as any).password).toBeUndefined();
  });
});
