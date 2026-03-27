import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('Feedback (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        // 注册用户获取 token
        const suffix = Date.now().toString();
        const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `fb_${suffix}`,
                email: `fb_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken = res.body.data.accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /feedback/add should create feedback', async () => {
        const res = await request(app.getHttpServer())
            .post('/feedback/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                content: '系统速度很慢',
                email: 'user@test.com',
                type: 1,
            })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.content).toBe('系统速度很慢');
    });

    it('POST /feedback/add should work without token (public with optional auth)', async () => {
        const res = await request(app.getHttpServer())
            .post('/feedback/add')
            .send({ content: '匿名反馈' });

        // 取决于 AuthGuard 是否阻止无 token 请求
        // feedback/add 需要 token（API 文档说明）
        expect(res.status).toBe(401);
    });
});
