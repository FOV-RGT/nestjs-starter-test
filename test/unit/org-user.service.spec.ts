import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { OrgUserService } from '@/modules/organization/org-user.service.js';

loadEnv('test', { quiet: true });

describe('OrgUserService', () => {
    const mockDatabaseService: any = {
        organization: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        orgUser: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
        },
    };

    let service: OrgUserService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OrgUserService(mockDatabaseService);
    });

    // ===== apply =====
    it('apply should create a pending application', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({ id: 'org_1' });
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);
        mockDatabaseService.orgUser.create.mockResolvedValue({
            id: 'ou_1',
            status: 0,
            inviteType: 'apply',
        });

        await service.apply('org_1', '请求加入', 'u_1');

        expect(mockDatabaseService.orgUser.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                orgId: 'org_1',
                userId: 'u_1',
                status: 0,
                inviteType: 'apply',
            }),
        });
    });

    it('apply should throw when already a member', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue({ id: 'org_1' });
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({ status: 1 });

        await expect(service.apply('org_1', 'hi', 'u_1')).rejects.toBeInstanceOf(BusinessException);
    });

    it('apply should throw when org not found', async () => {
        mockDatabaseService.organization.findUnique.mockResolvedValue(null);

        await expect(service.apply('none', 'hi', 'u_1')).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== approveApplication =====
    it('approveApplication should update status and increment member', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({
            id: 'ou_1',
            inviteType: 'apply',
            status: 0,
        });
        mockDatabaseService.orgUser.update.mockResolvedValue({});
        mockDatabaseService.organization.update.mockResolvedValue({});

        await service.approveApplication('org_1', 'u_2');

        expect(mockDatabaseService.orgUser.update).toHaveBeenCalledWith({
            where: { id: 'ou_1' },
            data: { status: 1 },
        });
        expect(mockDatabaseService.organization.update).toHaveBeenCalledWith({
            where: { id: 'org_1' },
            data: { member: { increment: 1 } },
        });
    });

    it('approveApplication should throw when no pending apply', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);

        await expect(service.approveApplication('org_1', 'u_2')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== kickUser =====
    it('kickUser should remove member and decrement count', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({ id: 'ou_1' });
        mockDatabaseService.orgUser.delete.mockResolvedValue({});
        mockDatabaseService.organization.update.mockResolvedValue({});

        await service.kickUser('org_1', 'u_target');

        expect(mockDatabaseService.orgUser.delete).toHaveBeenCalledWith({ where: { id: 'ou_1' } });
    });

    it('kickUser should throw when member not found', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);

        await expect(service.kickUser('org_1', 'u_ghost')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== invite =====
    it('invite should create a pending invite', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({ id: 'u_target', uid: 'uid_target' });
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);
        mockDatabaseService.orgUser.create.mockResolvedValue({
            id: 'ou_2',
            inviteType: 'invite',
            status: 0,
        });

        await service.invite('org_1', 'uid_target', 'u_1');

        expect(mockDatabaseService.orgUser.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                orgId: 'org_1',
                userId: 'u_target',
                inviteType: 'invite',
            }),
        });
    });

    it('invite should throw when target user not found', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue(null);

        await expect(service.invite('org_1', 'uid_ghost', 'u_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    it('invite should throw when user already a member', async () => {
        mockDatabaseService.user.findFirst.mockResolvedValue({ id: 'u_target' });
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({ status: 1 });

        await expect(service.invite('org_1', 'uid_target', 'u_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== acceptInvite =====
    it('acceptInvite should update status and increment member', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({
            id: 'ou_2',
            inviteType: 'invite',
            status: 0,
        });
        mockDatabaseService.orgUser.update.mockResolvedValue({});
        mockDatabaseService.organization.update.mockResolvedValue({});

        await service.acceptInvite('org_1', 'u_1');

        expect(mockDatabaseService.orgUser.update).toHaveBeenCalledWith({
            where: { id: 'ou_2' },
            data: { status: 1 },
        });
    });

    it('acceptInvite should throw when no pending invite', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);

        await expect(service.acceptInvite('org_1', 'u_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== getInviteMessages =====
    it('getInviteMessages should return pending invites', async () => {
        mockDatabaseService.orgUser.findMany.mockResolvedValue([
            { id: 'ou_3', inviteType: 'invite', organization: { name: 'Org' } },
        ]);

        const result = await service.getInviteMessages('u_1');

        expect(result).toHaveLength(1);
    });

    // ===== listUserOrgs =====
    it('listUserOrgs should return accepted orgs', async () => {
        mockDatabaseService.orgUser.findMany.mockResolvedValue([
            { organization: { id: 'org_1', name: '实验组' } },
        ]);

        const result = await service.listUserOrgs('u_1');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('实验组');
    });

    // ===== listMembers =====
    it('listMembers should return paginated members', async () => {
        mockDatabaseService.orgUser.findMany.mockResolvedValue([
            { user: { id: 'u_1', username: 'john' } },
        ]);
        mockDatabaseService.orgUser.count.mockResolvedValue(1);

        const result = await service.listMembers('org_1', 1, 10);

        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    // ===== quit =====
    it('quit should remove membership and decrement count', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({ id: 'ou_1' });
        mockDatabaseService.orgUser.delete.mockResolvedValue({});
        mockDatabaseService.organization.update.mockResolvedValue({});

        await service.quit('org_1', 'u_1');

        expect(mockDatabaseService.orgUser.delete).toHaveBeenCalledWith({ where: { id: 'ou_1' } });
    });

    it('quit should throw when not a member', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);

        await expect(service.quit('org_1', 'u_1')).rejects.toBeInstanceOf(BusinessException);
    });

    // ===== updateAuthority =====
    it('updateAuthority should update member role', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue({ id: 'ou_1' });
        mockDatabaseService.orgUser.update.mockResolvedValue({ id: 'ou_1', role: 2 });

        await service.updateAuthority('org_1', 'u_target', 2);

        expect(mockDatabaseService.orgUser.update).toHaveBeenCalledWith({
            where: { id: 'ou_1' },
            data: { role: 2 },
        });
    });

    it('updateAuthority should throw when member not found', async () => {
        mockDatabaseService.orgUser.findUnique.mockResolvedValue(null);

        await expect(service.updateAuthority('org_1', 'u_ghost', 2)).rejects.toBeInstanceOf(
            BusinessException
        );
    });
});
