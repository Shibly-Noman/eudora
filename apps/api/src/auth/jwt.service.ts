import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type JwtPayload = Record<string, unknown> & {
  exp?: number;
  iat?: number;
};

type TokenOptions = {
  expiresInSeconds: number;
  secret?: string;
};

@Injectable()
export class JwtService {
  sign(payload: Record<string, unknown>, options: TokenOptions): string {
    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + options.expiresInSeconds
    };
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const signature = sign(`${encodedHeader}.${encodedBody}`, options.secret ?? this.resolveSecret());

    return `${encodedHeader}.${encodedBody}.${signature}`;
  }

  verify(token: string, secret = this.resolveSecret()): JwtPayload {
    const [encodedHeader, encodedBody, signature] = token.split(".");

    if (!encodedHeader || !encodedBody || !signature) {
      throw new UnauthorizedException("Invalid token");
    }

    const expectedSignature = sign(`${encodedHeader}.${encodedBody}`, secret);

    if (!safeEqual(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid token");
    }

    const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8")) as JwtPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token expired");
    }

    return payload;
  }

  createOpaqueToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private resolveSecret(): string {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production");
    }

    return "dev-only-eudora-jwt-secret";
  }
}

function sign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
