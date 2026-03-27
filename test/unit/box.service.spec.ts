import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { BoxService } from '@/modules/box/box.service.js';

loadEnv('test', { quiet: true });

describe('BoxService', () => {
    const mockDatabaseService: any = {
        box: {
            create: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        boxAlias: {
            create: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        boxImage: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        boxLog: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    };

    let service: BoxService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new BoxService(mockDatabaseService);
    });

    // ===== Box CRUD =====
    it('create should create a box', async () => {
        mockDatabaseService.box.create.mockResolvedValue({
            id: 'box_1',
            name: '冰箱A',
            orgId: 'org_1',
        });

        const result = await service.create({ name: '冰箱A' }, 'org_1', 'u_1');

        expect(result.name).toBe('冰箱A');
        expect(mockDatabaseService.box.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ name: '冰箱A', orgId: 'org_1', createBy: 'u_1' }),
        });
    });

    it('delete should remove an existing box', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1', orgId: 'org_1' });
        mockDatabaseService.box.delete.mockResolvedValue({});

        await service.delete('box_1', 'org_1');

        expect(mockDatabaseService.box.delete).toHaveBeenCalledWith({ where: { id: 'box_1' } });
    });

    it('delete should throw when box not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue(null);
        await expect(service.delete('none', 'org_1')).rejects.toBeInstanceOf(BusinessException);
    });

    it('findList should return paginated results', async () => {
        mockDatabaseService.box.findMany.mockResolvedValue([{ id: 'box_1' }]);
        mockDatabaseService.box.count.mockResolvedValue(1);

        const result = await service.findList('org_1', 1, 10);

        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('findOne should return a box', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1', name: '冰箱A' });

        const result = await service.findOne('box_1', 'org_1');

        expect(result.name).toBe('冰箱A');
    });

    it('findOne should throw when box not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue(null);
        await expect(service.findOne('none', 'org_1')).rejects.toBeInstanceOf(BusinessException);
    });

    it('findByRoom should return boxes in a room', async () => {
        mockDatabaseService.box.findMany.mockResolvedValue([{ id: 'box_r1' }]);
        mockDatabaseService.box.count.mockResolvedValue(1);

        const result = await service.findByRoom('org_1', 'room_1', 1, 10);

        expect(result.records).toHaveLength(1);
    });

    it('search should return matching boxes', async () => {
        mockDatabaseService.box.findMany.mockResolvedValue([{ id: 'box_s' }]);
        mockDatabaseService.box.count.mockResolvedValue(1);

        const result = await service.search('冰箱', 1, 10);

        expect(result.records).toHaveLength(1);
    });

    it('update should modify an existing box', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.box.update.mockResolvedValue({ id: 'box_1', name: '新名称' });

        const result = await service.update({ id: 'box_1', name: '新名称' }, 'org_1');

        expect(result.name).toBe('新名称');
    });

    it('update should throw when box not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue(null);
        await expect(service.update({ id: 'none', name: 'x' }, 'org_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== BoxAlias =====
    it('createAlias should create an alias', async () => {
        mockDatabaseService.boxAlias.create.mockResolvedValue({
            id: 'ba_1',
            aliasName: '别名1',
            boxId: 'box_1',
        });

        const result = await service.createAlias({ aliasName: '别名1', boxId: 'box_1' }, 'u_1');
        expect(result.aliasName).toBe('别名1');
    });

    it('deleteAlias should remove an existing alias', async () => {
        mockDatabaseService.boxAlias.findFirst.mockResolvedValue({ id: 'ba_1', boxId: 'box_1' });
        mockDatabaseService.boxAlias.delete.mockResolvedValue({});

        await service.deleteAlias('ba_1', 'box_1', 'org_1');
        expect(mockDatabaseService.boxAlias.delete).toHaveBeenCalledWith({ where: { id: 'ba_1' } });
    });

    it('deleteAlias should throw when alias not found', async () => {
        mockDatabaseService.boxAlias.findFirst.mockResolvedValue(null);
        await expect(service.deleteAlias('none', 'box_1', 'org_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    it('listAliases should return aliases', async () => {
        mockDatabaseService.boxAlias.findMany.mockResolvedValue([{ id: 'ba_1' }]);

        const result = await service.listAliases('box_1', 'org_1');
        expect(result).toHaveLength(1);
    });

    it('updateAlias should modify an alias', async () => {
        mockDatabaseService.boxAlias.findUnique.mockResolvedValue({ id: 'ba_1' });
        mockDatabaseService.boxAlias.update.mockResolvedValue({
            id: 'ba_1',
            aliasName: '新别名',
        });

        const result = await service.updateAlias({
            id: 'ba_1',
            aliasName: '新别名',
            boxId: 'box_1',
        });
        expect(result.aliasName).toBe('新别名');
    });

    it('updateAlias should throw when alias not found', async () => {
        mockDatabaseService.boxAlias.findUnique.mockResolvedValue(null);
        await expect(
            service.updateAlias({ id: 'none', aliasName: 'x', boxId: 'box_1' })
        ).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== BoxImage =====
    it('addImage should create a box image', async () => {
        mockDatabaseService.boxImage.create.mockResolvedValue({
            id: 'bi_1',
            url: '/uploads/img.png',
        });

        const result = await service.addImage('box_1', 'org_1', '/uploads/img.png', 'u_1');
        expect(result.url).toBe('/uploads/img.png');
    });

    it('compareImages should return last 2 images', async () => {
        mockDatabaseService.boxImage.findMany.mockResolvedValue([
            { id: 'bi_2', url: 'img2.png' },
            { id: 'bi_1', url: 'img1.png' },
        ]);

        const result = await service.compareImages('box_1', 'org_1');
        expect(result).toHaveLength(2);
    });

    it('listImages should return paginated images', async () => {
        mockDatabaseService.boxImage.findMany.mockResolvedValue([{ id: 'bi_1' }]);
        mockDatabaseService.boxImage.count.mockResolvedValue(1);

        const result = await service.listImages('box_1', 'org_1', 1, 10);
        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    // ===== BoxLog =====
    it('listLogs should return paginated logs', async () => {
        mockDatabaseService.boxLog.findMany.mockResolvedValue([{ id: 'bl_1' }]);
        mockDatabaseService.boxLog.count.mockResolvedValue(1);

        const result = await service.listLogs('box_1', 'org_1', 1, 10);
        expect(result.records).toHaveLength(1);
    });

    it('listReagentLogs should return paginated reagent logs', async () => {
        mockDatabaseService.boxLog.findMany.mockResolvedValue([{ id: 'bl_r1' }]);
        mockDatabaseService.boxLog.count.mockResolvedValue(1);

        const result = await service.listReagentLogs('reagent_1', 'org_1', 1, 10);
        expect(result.records).toHaveLength(1);
    });
});
