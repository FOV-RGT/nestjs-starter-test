import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { RoomService } from '@/modules/room/room.service.js';

loadEnv('test', { quiet: true });

describe('RoomService', () => {
    const mockDatabaseService: any = {
        room: {
            create: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    let service: RoomService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new RoomService(mockDatabaseService);
    });

    // ===== create =====
    it('create should create a room', async () => {
        mockDatabaseService.room.create.mockResolvedValue({
            id: 'room_1',
            roomName: '实验室A',
            orgId: 'org_1',
        });

        const result = await service.create({ roomName: '实验室A' }, 'org_1', 'u_1');

        expect(result.roomName).toBe('实验室A');
        expect(mockDatabaseService.room.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                roomName: '实验室A',
                orgId: 'org_1',
                createBy: 'u_1',
            }),
        });
    });

    // ===== delete =====
    it('delete should remove an existing room', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue({ id: 'room_1', orgId: 'org_1' });
        mockDatabaseService.room.delete.mockResolvedValue({});

        await service.delete('room_1', 'org_1');

        expect(mockDatabaseService.room.delete).toHaveBeenCalledWith({ where: { id: 'room_1' } });
    });

    it('delete should throw when room not found', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue(null);

        await expect(service.delete('nonexistent', 'org_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== findList =====
    it('findList should return paginated results', async () => {
        mockDatabaseService.room.findMany.mockResolvedValue([{ id: 'room_1' }]);
        mockDatabaseService.room.count.mockResolvedValue(1);

        const result = await service.findList('org_1', undefined, 1, 10);

        expect(result.records).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.pageNum).toBe(1);
    });

    // ===== findOne =====
    it('findOne should return a room', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue({
            id: 'room_1',
            roomName: '实验室A',
        });

        const result = await service.findOne('room_1', 'org_1');

        expect(result.roomName).toBe('实验室A');
    });

    it('findOne should throw when room not found', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue(null);

        await expect(service.findOne('nonexistent', 'org_1')).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    // ===== update =====
    it('update should modify an existing room', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue({ id: 'room_1', orgId: 'org_1' });
        mockDatabaseService.room.update.mockResolvedValue({
            id: 'room_1',
            roomName: '更新后的名称',
        });

        const result = await service.update({ id: 'room_1', roomName: '更新后的名称' }, 'org_1');

        expect(result.roomName).toBe('更新后的名称');
    });

    it('update should throw when room not found', async () => {
        mockDatabaseService.room.findFirst.mockResolvedValue(null);

        await expect(
            service.update({ id: 'nonexistent', roomName: 'x' }, 'org_1')
        ).rejects.toBeInstanceOf(BusinessException);
    });
});
