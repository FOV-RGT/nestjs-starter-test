import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { ReagentService } from '@/modules/reagent/reagent.service.js';

loadEnv('test', { quiet: true });

describe('ReagentService', () => {
    const mockDatabaseService: any = {
        box: {
            findFirst: jest.fn(),
        },
        reagent: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        boxLog: {
            create: jest.fn(),
        },
    };

    let service: ReagentService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ReagentService(mockDatabaseService);
    });

    // ===== findByBox =====
    it('findByBox should return reagents for a box', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1', orgId: 'org_1' });
        mockDatabaseService.reagent.findMany.mockResolvedValue([
            { id: 'r_1', name: '试剂A' },
            { id: 'r_2', name: '试剂B' },
        ]);

        const result = await service.findByBox('box_1', 'org_1');

        expect(result).toHaveLength(2);
    });

    it('findByBox should throw when box not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue(null);

        await expect(service.findByBox('none', 'org_1')).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== findOne =====
    it('findOne should return a single reagent', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.findFirst.mockResolvedValue({
            id: 'r_1',
            name: '试剂A',
        });

        const result = await service.findOne('r_1', 'box_1', 'org_1');

        expect(result.name).toBe('试剂A');
    });

    it('findOne should throw when reagent not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.findFirst.mockResolvedValue(null);

        await expect(service.findOne('none', 'box_1', 'org_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== batchUpdate =====
    it('batchUpdate should create new reagents (operateType=1)', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.create.mockResolvedValue({ id: 'r_new' });
        mockDatabaseService.boxLog.create.mockResolvedValue({});

        await service.batchUpdate(
            [{ name: '新试剂', operateType: 1, x: 1, y: 1 }],
            'box_1',
            'org_1',
            'u_1'
        );

        expect(mockDatabaseService.reagent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ name: '新试剂', boxId: 'box_1' }),
        });
        expect(mockDatabaseService.boxLog.create).toHaveBeenCalledTimes(1);
    });

    it('batchUpdate should update existing reagents (operateType=2)', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.update.mockResolvedValue({ id: 'r_1' });
        mockDatabaseService.boxLog.create.mockResolvedValue({});

        await service.batchUpdate(
            [{ id: 'r_1', name: '更新名', operateType: 2 }],
            'box_1',
            'org_1',
            'u_1'
        );

        expect(mockDatabaseService.reagent.update).toHaveBeenCalledWith({
            where: { id: 'r_1' },
            data: expect.objectContaining({ name: '更新名' }),
        });
    });

    it('batchUpdate should delete reagents (operateType=3)', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.delete.mockResolvedValue({});
        mockDatabaseService.boxLog.create.mockResolvedValue({});

        await service.batchUpdate([{ id: 'r_1', operateType: 3 }], 'box_1', 'org_1', 'u_1');

        expect(mockDatabaseService.reagent.delete).toHaveBeenCalledWith({ where: { id: 'r_1' } });
    });

    it('batchUpdate should throw when box not found', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue(null);

        await expect(
            service.batchUpdate([{ operateType: 1, name: 'x' }], 'none', 'org_1')
        ).rejects.toBeInstanceOf(BusinessException);
    });

    it('batchUpdate should process multiple operations', async () => {
        mockDatabaseService.box.findFirst.mockResolvedValue({ id: 'box_1' });
        mockDatabaseService.reagent.create.mockResolvedValue({});
        mockDatabaseService.reagent.update.mockResolvedValue({});
        mockDatabaseService.reagent.delete.mockResolvedValue({});
        mockDatabaseService.boxLog.create.mockResolvedValue({});

        await service.batchUpdate(
            [
                { name: '新增', operateType: 1, x: 0, y: 0 },
                { id: 'r_1', name: '更新', operateType: 2 },
                { id: 'r_2', operateType: 3 },
            ],
            'box_1',
            'org_1',
            'u_1'
        );

        expect(mockDatabaseService.reagent.create).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.reagent.update).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.reagent.delete).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.boxLog.create).toHaveBeenCalledTimes(3);
    });
});
