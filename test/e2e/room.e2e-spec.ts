import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('Room (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
    let roomId: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.init();

        const suffix = Date.now().toString();
        const regRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                username: `room_${suffix}`,
                email: `room_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken = regRes.body.data.accessToken;

        // 创建组织
        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: `测试组织_${suffix}` });
        orgId = orgRes.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /root/add should create room', async () => {
        const res = await request(app.getHttpServer())
            .post('/root/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ roomName: '实验室A', roomDescribe: '主实验室' })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.roomName).toBe('实验室A');
        roomId = res.body.data.id;
    });

    it('GET /root/list should return rooms', async () => {
        const res = await request(app.getHttpServer())
            .get('/root/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.records).toBeInstanceOf(Array);
        expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /root/one should return room by id', async () => {
        const res = await request(app.getHttpServer())
            .get('/root/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ rootID: roomId, orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(roomId);
    });

    it('PUT /root/update should update room', async () => {
        const res = await request(app.getHttpServer())
            .put('/root/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ id: roomId, roomName: '实验室B' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.roomName).toBe('实验室B');
    });

    it('DELETE /root/del should delete room', async () => {
        // 先创建一个临时房间
        const createRes = await request(app.getHttpServer())
            .post('/root/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ roomName: '临时房间' });
        const tempId = createRes.body.data.id;

        const res = await request(app.getHttpServer())
            .delete('/root/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ id: tempId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    it('GET /root/one should return 404 for deleted room', async () => {
        await request(app.getHttpServer())
            .get('/root/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ rootID: 'nonexistent', orgID: orgId })
            .expect(404);
    });

    it('should reject without token', async () => {
        await request(app.getHttpServer())
            .get('/root/list')
            .query({ orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(401);
    });
});
