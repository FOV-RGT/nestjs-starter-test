import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { UserService } from '@/modules/user/user.service.js';
import { EmailCodeService } from '@/modules/user/email-code.service.js';
import bcrypt from 'bcryptjs';

loadEnv('test', { quiet: true });

describe('UserService', () => {
    const passwordHash = bcrypt.hashSync('P@ssw0rd!', 10);

    const mockDatabaseService: any = {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockTokenService: any = {
        issueTokenPair: jest.fn().mockReturnValue({
            accessToken: 'test_at',
            refreshToken: 'test_rt',
        }),
    };

    let emailCodeService: EmailCodeService;
    let service: UserService;

    beforeEach(() => {
        jest.clearAllMocks();
        emailCodeService = new EmailCodeService();
        service = new UserService(mockDatabaseService, mockTokenService, emailCodeService);
    });

    // ===== register =====
    it('register should create user and return tokens', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue(null);
        mockDatabaseService.user.create.mockResolvedValue({
            id: 'u_1',
            username: 'test@example.com',
            email: 'test@example.com',
            passwordHash,
            nickName: 'Test',
            realName: 'Test User',
        });

        const result = await service.register({
            account: 'test@example.com',
            password: 'P@ssw0rd!',
            nickName: 'Test',
            realName: 'Test User',
        });

        expect(result.accessToken).toBe('test_at');
        expect(result.refreshToken).toBe('test_rt');
        expect(mockDatabaseService.user.create).toHaveBeenCalledTimes(1);
    });

    it('register should throw conflict on duplicate email', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({ id: 'u_existing' });

        await expect(
            service.register({
                account: 'dup@example.com',
                password: 'P@ssw0rd!',
            })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    it('register with invalid code should throw', async () => {
        await expect(
            service.register({
                account: 'test@example.com',
                password: 'P@ssw0rd!',
                code: 'wrong_code',
            })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    it('register with valid code should succeed', async () => {
        emailCodeService.generateCode('test@example.com');
        const code = emailCodeService.getCode('test@example.com') ?? '';

        mockDatabaseService.user.findFirst.mockResolvedValue(null);
        mockDatabaseService.user.create.mockResolvedValue({
            id: 'u_2',
            username: 'test@example.com',
            email: 'test@example.com',
            passwordHash,
        });

        const result = await service.register({
            account: 'test@example.com',
            password: 'P@ssw0rd!',
            code,
        });

        expect(result.accessToken).toBe('test_at');
    });

    // ===== login =====
    it('login should return tokens on valid credentials', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_3',
            username: 'john',
            email: 'john@example.com',
            passwordHash,
        });

        const result = await service.login({
            account: 'john@example.com',
            password: 'P@ssw0rd!',
        });

        expect(result.accessToken).toBe('test_at');
        expect(mockTokenService.issueTokenPair).toHaveBeenCalledWith({
            userId: 'u_3',
            username: 'john',
        });
    });

    it('login should throw on wrong password', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_3',
            username: 'john',
            passwordHash,
        });

        await expect(
            service.login({ account: 'john', password: 'wrongpassword' })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    it('login should throw on non-existent user', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue(null);

        await expect(
            service.login({ account: 'ghost', password: 'P@ssw0rd!' })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== sendEmailCode =====
    it('sendEmailCode should generate and return a code', async () => {
        const code = await service.sendEmailCode('user@example.com');
        expect(code).toBeTruthy();
        expect(code.length).toBeGreaterThanOrEqual(4);
    });

    // ===== emailLogin =====
    it('emailLogin should succeed with valid code', async () => {
        emailCodeService.generateCode('user@example.com');
        const code = emailCodeService.getCode('user@example.com') ?? '';

        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_email',
            username: 'user@example.com',
            email: 'user@example.com',
            passwordHash,
        });

        const result = await service.emailLogin({ email: 'user@example.com', code });

        expect(result.accessToken).toBe('test_at');
    });

    it('emailLogin should reject invalid code', async () => {
        await expect(
            service.emailLogin({ email: 'user@example.com', code: 'bad' })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    it('emailLogin should reject if user not found', async () => {
        emailCodeService.generateCode('ghost@example.com');
        const code = emailCodeService.getCode('ghost@example.com') ?? '';
        mockDatabaseService.user.findFirst.mockResolvedValue(null);

        await expect(
            service.emailLogin({ email: 'ghost@example.com', code })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== emailUpdatePassword =====
    it('emailUpdatePassword should update password with valid code', async () => {
        emailCodeService.generateCode('user@example.com');
        const code = emailCodeService.getCode('user@example.com') ?? '';

        mockDatabaseService.user.findFirst.mockResolvedValue({
            id: 'u_pw',
            email: 'user@example.com',
            passwordHash,
        });
        mockDatabaseService.user.update.mockResolvedValue({});

        await service.emailUpdatePassword({
            email: 'user@example.com',
            code,
            newPassword: 'NewP@ss1!',
        });

        expect(mockDatabaseService.user.update).toHaveBeenCalledTimes(1);
    });

    it('emailUpdatePassword should reject invalid code', async () => {
        await expect(
            service.emailUpdatePassword({
                email: 'user@example.com',
                code: 'wrong',
                newPassword: 'NewP@ss1!',
            })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== getUserInfo =====
    it('getUserInfo should return user without passwordHash', async () => {
        mockDatabaseService.user.findUnique.mockResolvedValue({
            id: 'u_info',
            username: 'john',
            email: 'john@example.com',
            passwordHash,
            nickName: 'John',
            realName: 'John Doe',
            uid: 'uid_1',
        });

        const info = await service.getUserInfo('u_info');
        expect(info.email).toBe('john@example.com');
        expect(info).not.toHaveProperty('passwordHash');
    });

    it('getUserInfo should throw on non-existent user', async () => {
        mockDatabaseService.user.findUnique.mockResolvedValue(null);
        await expect(service.getUserInfo('u_none')).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== searchUsers =====
    it('searchUsers should return paginated results', async () => {
        mockDatabaseService.user.findMany.mockResolvedValue([
            { id: 'u_s1', username: 'alice', nickName: 'Alice' },
        ]);
        mockDatabaseService.user.count.mockResolvedValue(1);

        const result = await service.searchUsers('alice', 1, 10);
        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    // ===== updateInfo =====
    it('updateInfo should update nickName and realName', async () => {
        mockDatabaseService.user.update.mockResolvedValue({});

        await service.updateInfo('u_upd', { nickName: 'New Nick', realName: 'New Real' });

        expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
            where: { id: 'u_upd' },
            data: { nickName: 'New Nick', realName: 'New Real' },
        });
    });

    // ===== updatePassword =====
    it('updatePassword should succeed with correct old password', async () => {
        mockDatabaseService.user.findUnique.mockResolvedValue({
            id: 'u_pw2',
            passwordHash,
        });
        mockDatabaseService.user.update.mockResolvedValue({});

        await service.updatePassword('u_pw2', {
            oldPassword: 'P@ssw0rd!',
            newPassword: 'NewP@ss1!',
        });

        expect(mockDatabaseService.user.update).toHaveBeenCalledTimes(1);
    });

    it('updatePassword should throw on wrong old password', async () => {
        mockDatabaseService.user.findUnique.mockResolvedValue({
            id: 'u_pw2',
            passwordHash,
        });

        await expect(
            service.updatePassword('u_pw2', {
                oldPassword: 'wrongold',
                newPassword: 'NewP@ss1!',
            })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== updateEmail =====
    it('updateEmail should succeed with valid code and no conflict', async () => {
        emailCodeService.generateCode('new@example.com');
        const code = emailCodeService.getCode('new@example.com') ?? '';

        mockDatabaseService.user.findFirst.mockResolvedValue(null);
        mockDatabaseService.user.update.mockResolvedValue({});

        await service.updateEmail('u_em', { code, newEmail: 'new@example.com' });

        expect(mockDatabaseService.user.update).toHaveBeenCalledTimes(1);
    });

    it('updateEmail should throw on duplicate email', async () => {
        emailCodeService.generateCode('dup@example.com');
        const code = emailCodeService.getCode('dup@example.com') ?? '';

        mockDatabaseService.user.findFirst.mockResolvedValue({ id: 'u_other' });

        await expect(
            service.updateEmail('u_em', { code, newEmail: 'dup@example.com' })
        ).rejects.toBeInstanceOf(BusinessException);
    });
});
