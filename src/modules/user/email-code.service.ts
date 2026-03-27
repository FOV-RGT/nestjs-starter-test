import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailCodeService {
    private codes = new Map<string, { code: string; expiresAt: number }>();

    generateCode(email: string): string {
        const code = Math.random().toString().slice(2, 8);
        this.codes.set(email.toLowerCase(), {
            code,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });
        return code;
    }

    verifyCode(email: string, code: string): boolean {
        const stored = this.codes.get(email.toLowerCase());
        if (!stored) return false;
        if (Date.now() > stored.expiresAt) {
            this.codes.delete(email.toLowerCase());
            return false;
        }
        if (stored.code !== code) return false;
        this.codes.delete(email.toLowerCase());
        return true;
    }

    /** 仅用于测试：获取验证码 */
    getCode(email: string): string | undefined {
        return this.codes.get(email.toLowerCase())?.code;
    }
}
