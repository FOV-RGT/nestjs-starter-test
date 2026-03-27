import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { OrganizationService } from '@/modules/organization/organization.service.js';

loadEnv('test', { quiet: true });

describe('OrganizationService', () => {
    const mockDatabaseService: any = {
        organization: {
            create: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        orgUser: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };

    let service: OrganizationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OrganizationService(mockDatabaseService);
    });

    it('create should create org and add creator as admin', async () => {
        mockDatabaseService.organization.create.mockResolvedValue({
            id: 'org_1',
            name: '实验组',
            createBy: 'u_1',
        });
        mockDatabaseService.orgUser.create.mockResolvedValue({});

        const result = await service.create({ name: '实验组' }, 'u_1');

        expect(result.name).toBe('实验组');
        expect(mockDatabaseService.orgUser.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ orgId: 'org_1', userId: 'u_1', role: 1, status: 1 }),
        });
    });

    it('delete should remove org when called by creator', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({
            id: 'org_1',
            createBy: 'u_1',
        });
        mockDatabaseService.organization.delete.mockResolvedValue({});

        await service.delete('org_1', 'u_1');

        expect(mockDatabaseService.organization.delete).toHaveBeenCalledWith({
            where: { id: 'org_1' },
        });
    });

    it('delete should throw when org not found', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue(null);

        await expect(service.delete('none', 'u_1')).rejects.toBeInstanceOf(BusinessException);
    });

    it('delete should throw when not creator', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({
            id: 'org_1',
            createBy: 'u_other',
        });

        await expect(service.delete('org_1', 'u_1')).rejects.toBeInstanceOf(BusinessException);
    });

    it('findUserOrgs should return orgs for user', async () => {
        mockDatabaseService.orgUser.findMany.mockResolvedValue([
            { organization: { id: 'org_1', name: '实验组' } },
        ]);

        const result = await service.findUserOrgs('u_1');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('实验组');
    });

    it('findOne should return org', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({
            id: 'org_1',
            name: '实验组',
        });

        const result = await service.findOne('org_1');

        expect(result.name).toBe('实验组');
    });

    it('findOne should throw when org not found', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue(null);
        await expect(service.findOne('none')).rejects.toBeInstanceOf(BusinessException);
    });

    it('search should return paginated results', async () => {
        mockDatabaseService.organization.findMany.mockResolvedValue([{ id: 'org_1' }]);
        mockDatabaseService.organization.count.mockResolvedValue(1);

        const result = await service.search('实验', 1, 10);

        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('update should modify org', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({ id: 'org_1' });
        mockDatabaseService.organization.update.mockResolvedValue({
            id: 'org_1',
            name: '新名称',
        });

        const result = await service.update({ id: 'org_1', name: '新名称' }, 'u_1');

        expect(result.name).toBe('新名称');
    });

    it('update should throw when org not found', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue(null);
        await expect(service.update({ id: 'none', name: 'x' }, 'u_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });
});
