import { AppModule } from '@/app.module.js';
import { loadEnv } from '@/constants/index.js';

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';

loadEnv('test', { quiet: true });

describe('Reagent (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let orgId: string;
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
                username: `reagent_${suffix}`,
                email: `reagent_${suffix}@example.com`,
                password: 'P@ssw0rd!',
            });
        accessToken = regRes.body.data.accessToken;

        // 创建组织
        const orgRes = await request(app.getHttpServer())
            .post('/org/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: `ReagentOrg_${suffix}` });
        orgId = orgRes.body.data.id;

        // 创建房间
        const roomRes = await request(app.getHttpServer())
            .post('/root/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ roomName: '试剂室' });
        const roomId = roomRes.body.data.id;

        // 创建盒子
        const boxRes = await request(app.getHttpServer())
            .post('/box/add')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ orgID: orgId })
            .send({ name: '试剂盒', rootId: roomId });
        boxId = boxRes.body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    let reagentId: string;

    it('POST /reagent/update should batch create reagents', async () => {
        const res = await request(app.getHttpServer())
            .post('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .send([
                { name: '试剂X', operateType: 1, x: 0, y: 0 },
                { name: '试剂Y', operateType: 1, x: 1, y: 0 },
            ])
            .expect(201);

        expect(res.body.success).toBe(true);
    });

    it('GET /reagent/list should return reagents', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        reagentId = res.body.data[0].id;
    });

    it('GET /reagent/one should return reagent detail', async () => {
        const res = await request(app.getHttpServer())
            .get('/reagent/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ reagentID: reagentId, boxID: boxId, orgID: orgId })
            .expect(200);

        expect(res.body.data.id).toBe(reagentId);
    });

    it('POST /reagent/update should batch update reagents', async () => {
        const res = await request(app.getHttpServer())
            .post('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .send([{ id: reagentId, name: '更新试剂', operateType: 2 }])
            .expect(201);

        expect(res.body.success).toBe(true);

        // 验证更新
        const detail = await request(app.getHttpServer())
            .get('/reagent/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ reagentID: reagentId, boxID: boxId, orgID: orgId });

        expect(detail.body.data.name).toBe('更新试剂');
    });

    it('POST /reagent/update should batch delete reagents', async () => {
        // 获取所有试剂
        const listRes = await request(app.getHttpServer())
            .get('/reagent/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId });

        const lastReagent = listRes.body.data[listRes.body.data.length - 1];

        const res = await request(app.getHttpServer())
            .post('/reagent/update')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ boxID: boxId, orgID: orgId })
            .send([{ id: lastReagent.id, operateType: 3 }])
            .expect(201);

        expect(res.body.success).toBe(true);
    });

    it('GET /reagent/one should return 404 for nonexistent', async () => {
        await request(app.getHttpServer())
            .get('/reagent/one')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ reagentID: 'nonexistent', boxID: boxId, orgID: orgId })
            .expect(404);
    });

    it('GET /box/log/reagen/list should return reagent logs', async () => {
        const res = await request(app.getHttpServer())
            .get('/box/log/reagen/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ reagentID: reagentId, orgID: orgId, pageNum: 1, pageSize: 10 })
            .expect(200);

        expect(res.body.data.records).toBeInstanceOf(Array);
    });
});
