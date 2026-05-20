import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [scheme, salt, hash] = passwordHash.split("$");

    if (scheme !== "scrypt" || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
