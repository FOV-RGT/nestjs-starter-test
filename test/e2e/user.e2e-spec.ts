import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';
import { EmailCodeService } from '@/modules/user/email-code.service.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('User (e2e)', () => {
    let app: INestApplication;
    let emailCodeService: EmailCodeService;
    const suffix = Date.now().toString();
    const testEmail = `usertest_${suffix}@example.com`;
    let accessToken: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        emailCodeService = app.get(EmailCodeService);
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== 注册 =====
    it('POST /user/register should create user', async () => {
        const res = await request(app.getHttpServer())
            .post('/user/register')
            .send({
                account: testEmail,
                password: 'P@ssw0rd!',
                nickName: '测试用户',
                realName: '张三',
            })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeTruthy();
        accessToken = res.body.data.accessToken;
    });

    it('POST /user/register should reject duplicate email', async () => {
        const res = await request(app.getHttpServer())
            .post('/user/register')
            .send({
                account: testEmail,
                password: 'P@ssw0rd!',
                nickName: '重复',
            })
            .expect(409);

        expect(res.body.success).toBe(false);
    });

    // ===== 登录 =====
    it('POST /user/login should return tokens', async () => {
        const res = await request(app.getHttpServer())
            .post('/user/login')
            .send({ account: testEmail, password: 'P@ssw0rd!' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeTruthy();
        accessToken = res.body.data.accessToken;
    });

    it('POST /user/login should reject wrong password', async () => {
        await request(app.getHttpServer())
            .post('/user/login')
            .send({ account: testEmail, password: 'wrong' })
            .expect(401);
    });

    // ===== 邮箱验证码 =====
    it('GET /user/email/code should send code', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/email/code')
            .query({ email: testEmail })
            .expect(200);

        expect(res.body.success).toBe(true);

        // 验证码应已存储
        const code = emailCodeService.getCode(testEmail);
        expect(code).toBeTruthy();
    });

    it('POST /user/email/login should work with valid code', async () => {
        // 先发送验证码
        await request(app.getHttpServer()).get('/user/email/code').query({ email: testEmail });

        const code = emailCodeService.getCode(testEmail);

        const res = await request(app.getHttpServer())
            .post('/user/email/login')
            .send({ email: testEmail, code })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBeTruthy();
    });

    it('POST /user/email/login should reject invalid code', async () => {
        await request(app.getHttpServer())
            .post('/user/email/login')
            .send({ email: testEmail, code: '000000' })
            .expect(400);
    });

    // ===== 个人信息 =====
    it('GET /user/info should return user info', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/info')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testEmail);
        expect(res.body.data.nickName).toBe('测试用户');
        expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('GET /user/info should reject without token', async () => {
        await request(app.getHttpServer()).get('/user/info').expect(401);
    });

    // ===== 搜索 =====
    it('GET /user/search should return results', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/search')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ s: '测试', pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    // ===== 修改信息 =====
    it('PUT /user/update/info should update nickname', async () => {
        const res = await request(app.getHttpServer())
            .put('/user/update/info')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ nickName: '新昵称', realName: '李四' })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    // ===== 修改密码 =====
    it('PUT /user/update/password should change password', async () => {
        const res = await request(app.getHttpServer())
            .put('/user/update/password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ oldPassword: 'P@ssw0rd!', newPassword: 'NewP@ss1!' })
            .expect(200);

        expect(res.body.success).toBe(true);

        // 使用新密码登录
        const loginRes = await request(app.getHttpServer())
            .post('/user/login')
            .send({ account: testEmail, password: 'NewP@ss1!' })
            .expect(201);

        expect(loginRes.body.data.accessToken).toBeTruthy();
        accessToken = loginRes.body.data.accessToken;
    });

    // ===== 邮箱修改密码 =====
    it('PUT /user/email/update/password should reset password', async () => {
        await request(app.getHttpServer()).get('/user/email/code').query({ email: testEmail });

        const code = emailCodeService.getCode(testEmail);

        const res = await request(app.getHttpServer())
            .put('/user/email/update/password')
            .send({ email: testEmail, code, newPassword: 'Reset@123' })
            .expect(200);

        expect(res.body.success).toBe(true);

        // 使用重置后密码登录
        const loginRes = await request(app.getHttpServer())
            .post('/user/login')
            .send({ account: testEmail, password: 'Reset@123' })
            .expect(201);

        accessToken = loginRes.body.data.accessToken;
    });

    // ===== 修改邮箱 =====
    it('PUT /user/update/email should change email', async () => {
        const newEmail = `newemail_${suffix}@example.com`;

        // 先获取新邮箱的验证码
        await request(app.getHttpServer()).get('/user/email/code').query({ email: newEmail });

        const code = emailCodeService.getCode(newEmail);

        const res = await request(app.getHttpServer())
            .put('/user/update/email')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ code, newEmail })
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});
