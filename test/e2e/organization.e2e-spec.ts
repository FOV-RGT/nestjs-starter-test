import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('Organization (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let accessToken2: string;
    let orgId: string;
    let userId2: string;
    let uid2: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        const suffix = Date.now().toString();

        // 用户 1（管理员）
        const reg1 = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `org_admin_${suffix}`,
                email: `org_admin_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken = reg1.body.data.accessToken;

        // 用户 2（普通成员）
        const reg2 = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `org_member_${suffix}`,
                email: `org_member_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken2 = reg2.body.data.accessToken;

        // 获取用户2的信息
        const info2 = await request(app.getHttpServer())
            .get('/user/info')
            .set('Authorization', `Bearer ${accessToken2}`);
        userId2 = info2.body.data.id;
        uid2 = info2.body.data.uid;
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== Organization CRUD =====
    it('POST /org/create should create organization', async () => {
        const res = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: '测试实验室', introduce: '用于测试' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('测试实验室');
        orgId = res.body.data.id;
    });

    it('GET /org/list should return user orgs', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /org/one should return org by id', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .expect(200);

        expect(res.body.data.id).toBe(orgId);
    });

    it('GET /org/search should be public', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/search')
            .query({ name: '测试', pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('PUT /org/update should update org', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: orgId, name: '更新实验室' })
            .expect(200);

        expect(res.body.data.name).toBe('更新实验室');
    });

    // ===== OrgUser - 邀请流程 =====
    it('PUT /org/user/invite should invite user', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/user/invite')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, uid: uid2 })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('GET /org/user/invite/ms should return invite messages', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/user/invite/ms')
            .set('Authorization', `Bearer ${accessToken2}`)
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /org/user/invite/ac should accept invite', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/user/invite/ac')
            .set('Authorization', `Bearer ${accessToken2}`)
            .query({ orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('GET /org/user/member/list should return members', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/user/member/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
        expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('PUT /org/user/updateAuthority should change role', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/user/updateAuthority')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, userID: userId2, role: '1' })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('DELETE /org/user/quit should let user leave', async () => {
        const res = await request(app.getHttpServer())
            .delete('/org/user/quit')
            .set('Authorization', `Bearer ${accessToken2}`)
            .query({ orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    // ===== OrgUser - 申请流程 =====
    it('PUT /org/user/apply should apply to join', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/user/apply')
            .set('Authorization', `Bearer ${accessToken2}`)
            .query({ orgID: orgId, ms: '请求加入' })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('GET /org/user/apply/ms should return applications', async () => {
        const res = await request(app.getHttpServer())
            .get('/org/user/apply/ms')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
    });

    it('PUT /org/user/apply/ac should approve application', async () => {
        const res = await request(app.getHttpServer())
            .put('/org/user/apply/ac')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, userID: userId2 })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('DELETE /org/user/del should kick user', async () => {
        const res = await request(app.getHttpServer())
            .delete('/org/user/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, userID: userId2 })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    // ===== Delete org =====
    it('DELETE /org/del should reject non-creator', async () => {
        // 用户2不是创建者
        await request(app.getHttpServer())
            .delete('/org/del')
            .set('Authorization', `Bearer ${accessToken2}`)
            .query({ orgID: orgId })
            .expect(403);
    });

    it('DELETE /org/del should delete org', async () => {
        const res = await request(app.getHttpServer())
            .delete('/org/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});
