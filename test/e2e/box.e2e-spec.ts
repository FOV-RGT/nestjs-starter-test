import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('Box (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
    let roomId: string;
    let boxId: string;

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
                username: `box_${suffix}`,
                email: `box_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken = regRes.body.data.accessToken;

        // 创建组织
        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: `BoxOrg_${suffix}` });
        orgId = orgRes.body.data.id;

        // 创建房间
        const roomRes = await request(app.getHttpServer())
            .post('/root/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ roomName: '房间1' });
        roomId = roomRes.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== Box CRUD =====
    it('POST /box/add should create box', async () => {
        const res = await request(app.getHttpServer())
            .post('/box/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ name: '盒子A', shortName: 'A', rootId: roomId })
            .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('盒子A');
        boxId = res.body.data.id;
    });

    it('GET /box/list should return boxes', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
        expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('GET /box/one should return box by id', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.data.id).toBe(boxId);
    });

    it('GET /box/root/list should return boxes by room (public)', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/root/list')
            .query({ orgID: orgId, rootID: roomId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('GET /box/search should search boxes (public)', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/search')
            .query({ c: '盒子', pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('PUT /box/update should update box', async () => {
        const res = await request(app.getHttpServer())
            .put('/box/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ id: boxId, name: '盒子B' })
            .expect(200);

        expect(res.body.data.name).toBe('盒子B');
    });

    // ===== Alias =====
    let aliasId: string;

    it('POST /box/alias/add should create alias', async () => {
        const res = await request(app.getHttpServer())
            .post('/box/alias/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ aliasName: '别名1', boxId })
            .expect(201);

        expect(res.body.data.aliasName).toBe('别名1');
        aliasId = res.body.data.id;
    });

    it('GET /box/alias/list should return aliases', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/alias/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /box/alias/update should update alias', async () => {
        const res = await request(app.getHttpServer())
            .put('/box/alias/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ id: aliasId, aliasName: '新别名', boxId })
            .expect(200);

        expect(res.body.data.aliasName).toBe('新别名');
    });

    it('DELETE /box/alias/del should delete alias', async () => {
        const res = await request(app.getHttpServer())
            .delete('/box/alias/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxAliasID: aliasId, boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });

    // ===== Image =====
    it('POST /box/image/add should add image', async () => {
        const res = await request(app.getHttpServer())
            .post('/box/image/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId, url: 'https://example.com/img1.png' })
            .expect(201);

        expect(res.body.data.url).toBe('https://example.com/img1.png');
    });

    it('GET /box/image/list should return images', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/image/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    it('GET /box/image/compare should return latest images', async () => {
        // 添加第二张图
        await request(app.getHttpServer())
            .post('/box/image/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId, url: 'https://example.com/img2.png' });

        const res = await request(app.getHttpServer())
            .get('/box/image/compare')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    // ===== Log =====
    it('GET /box/log/list should return box logs', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/log/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });

    // ===== Delete =====
    it('DELETE /box/del should delete box', async () => {
        // 先创建一个临时盒子
        const createRes = await request(app.getHttpServer())
            .post('/box/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ name: '临时盒子' });
        const tempBoxId = createRes.body.data.id;

        const res = await request(app.getHttpServer())
            .delete('/box/del')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: tempBoxId, orgID: orgId })
            .expect(200);

        expect(res.body.success).toBe(true);
    });
});
