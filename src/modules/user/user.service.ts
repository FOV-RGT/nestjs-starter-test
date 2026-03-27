import {
    UserRegisterDto,
    UserLoginDto,
    EmailLoginDto,
    EmailUpdatePasswordDto,
    UpdateInfoDto,
    UpdatePasswordDto,
    UpdateEmailDto,
} from './user.dto.js';
import { EmailCodeService } from './email-code.service.js';
import { TokenService } from '../auth/services/token.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';
import bcrypt from 'bcryptjs';

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class UserService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly tokenService: TokenService,
        private readonly emailCodeService: EmailCodeService
    ) {}

    async register(dto: UserRegisterDto): Promise<AuthResult> {
        const email = dto.account.trim().toLowerCase();

        if (dto.code) {
            const valid = this.emailCodeService.verifyCode(email, dto.code);
            if (!valid) {
                throw new BusinessException(
                    '验证码无效',
                    'VALIDATION_FAILED',
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        const existing = await this.databaseService.user.findFirst({
            where: { email },
        });
        if (existing) {
            throw new BusinessException('邮箱已注册', 'RESOURCE_CONFLICT', HttpStatus.CONFLICT);
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.databaseService.user.create({
            data: {
                username: email,
                email,
                passwordHash,
                nickName: dto.nickName,
                realName: dto.realName,
            },
        });

        const tokens = this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });

        return tokens;
    }

    async login(dto: UserLoginDto): Promise<AuthResult> {
        const account = dto.account.trim().toLowerCase();
        const user = await this.databaseService.user.findFirst({
            where: {
                OR: [
                    { username: { equals: account, mode: 'insensitive' } },
                    { email: { equals: account, mode: 'insensitive' } },
                ],
            },
        });
        if (!user) {
            throw new BusinessException('账号或密码错误', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new BusinessException('账号或密码错误', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }

        return this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });
    }

    async sendEmailCode(email: string): Promise<string> {
        const code = this.emailCodeService.generateCode(email);
        // 实际项目中这里会发送邮件
        return code;
    }

    async emailLogin(dto: EmailLoginDto): Promise<AuthResult> {
        const valid = this.emailCodeService.verifyCode(dto.email, dto.code);
        if (!valid) {
            throw new BusinessException('验证码无效', 'VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
        }

        const user = await this.databaseService.user.findFirst({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (!user) {
            throw new BusinessException('用户不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        return this.tokenService.issueTokenPair({
            userId: user.id,
            username: user.username,
        });
    }

    async emailUpdatePassword(dto: EmailUpdatePasswordDto): Promise<void> {
        const valid = this.emailCodeService.verifyCode(dto.email, dto.code);
        if (!valid) {
            throw new BusinessException('验证码无效', 'VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
        }

        const user = await this.databaseService.user.findFirst({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (!user) {
            throw new BusinessException('用户不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.databaseService.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });
    }

    async getUserInfo(userId: string) {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new BusinessException('用户不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        const { passwordHash: _ph, ...safeUser } = user;
        return safeUser;
    }

    async searchUsers(search: string, pageNum: number, pageSize: number) {
        const where = {
            OR: [
                { username: { contains: search, mode: 'insensitive' as const } },
                { nickName: { contains: search, mode: 'insensitive' as const } },
                { realName: { contains: search, mode: 'insensitive' as const } },
            ],
        };
        const [records, total] = await Promise.all([
            this.databaseService.user.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    nickName: true,
                    realName: true,
                    uid: true,
                },
            }),
            this.databaseService.user.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async updateEmail(userId: string, dto: UpdateEmailDto): Promise<void> {
        const valid = this.emailCodeService.verifyCode(dto.newEmail, dto.code);
        if (!valid) {
            throw new BusinessException('验证码无效', 'VALIDATION_FAILED', HttpStatus.BAD_REQUEST);
        }

        const existing = await this.databaseService.user.findFirst({
            where: { email: dto.newEmail.trim().toLowerCase() },
        });
        if (existing) {
            throw new BusinessException('邮箱已被使用', 'RESOURCE_CONFLICT', HttpStatus.CONFLICT);
        }

        await this.databaseService.user.update({
            where: { id: userId },
            data: { email: dto.newEmail.trim().toLowerCase() },
        });
    }

    async updateInfo(userId: string, dto: UpdateInfoDto): Promise<void> {
        await this.databaseService.user.update({
            where: { id: userId },
            data: {
                nickName: dto.nickName,
                realName: dto.realName,
            },
        });
    }

    async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new BusinessException('用户不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        const isOldValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!isOldValid) {
            throw new BusinessException('原密码错误', 'AUTH_FAILED', HttpStatus.BAD_REQUEST);
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.databaseService.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }
}
