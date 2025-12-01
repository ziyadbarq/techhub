import { injectable } from "inversify";
import {
  generateSecurePassword,
  hashPassword,
  verifyPassword,
} from "@/lib/utils/password";
import type { IPasswordService } from "@/core/services/password.service.interface";

/**
 * Password service implementation backed by Better Auth crypto helpers.
 */
@injectable()
export class PasswordService implements IPasswordService {
  generate(options?: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }): string {
    return generateSecurePassword(options);
  }

  async hash(password: string): Promise<string> {
    return hashPassword(password);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return verifyPassword(password, hash);
  }
}
