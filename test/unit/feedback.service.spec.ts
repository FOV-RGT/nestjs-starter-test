import { loadEnv } from '@/constants/index.js';
import { FeedbackService } from '@/modules/feedback/feedback.service.js';

loadEnv('test', { quiet: true });

describe('FeedbackService', () => {
    const mockDatabaseService: any = {
        feedback: {
            create: jest.fn(),
        },
    };

    let service: FeedbackService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new FeedbackService(mockDatabaseService);
    });

    it('create should create feedback with userId', async () => {
        const created = {
            id: 'fb_1',
            content: '建议改进UI',
            email: 'user@example.com',
            type: 1,
            progress: 0,
            createBy: 'u_1',
        };
        mockDatabaseService.feedback.create.mockResolvedValue(created);

        const result = await service.create(
            { content: '建议改进UI', email: 'user@example.com', type: 1 },
            'u_1'
        );

        expect(result.id).toBe('fb_1');
        expect(result.content).toBe('建议改进UI');
        expect(mockDatabaseService.feedback.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                content: '建议改进UI',
                email: 'user@example.com',
                type: 1,
                createBy: 'u_1',
            }),
        });
    });

    it('create should work without userId', async () => {
        mockDatabaseService.feedback.create.mockResolvedValue({
            id: 'fb_2',
            content: 'anonymous',
            createBy: undefined,
        });

        const result = await service.create({ content: 'anonymous' });

        expect(result.id).toBe('fb_2');
        expect(mockDatabaseService.feedback.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ createBy: undefined }),
        });
    });
});
