import { loadEnv } from '@/constants/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { FileService } from '@/modules/file/file.service.js';

loadEnv('test', { quiet: true });

describe('FileService', () => {
    let service: FileService;

    beforeEach(() => {
        service = new FileService();
    });

    it('upload should reject empty file', async () => {
        const mockRequest = {
            [Symbol.asyncIterator]: async function* () {
                // yield nothing - empty file
            },
        } as any;

        await expect(service.upload('test.txt', mockRequest)).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    it('upload should reject files larger than 10MB', async () => {
        const bigChunk = Buffer.alloc(11 * 1024 * 1024);
        const mockRequest = {
            [Symbol.asyncIterator]: async function* () {
                yield bigChunk;
            },
        } as any;

        await expect(service.upload('big.bin', mockRequest)).rejects.toBeInstanceOf(
            BusinessException
        );
    });

    it('upload should sanitize file name to prevent path traversal', async () => {
        const smallChunk = Buffer.from('hello');
        const mockRequest = {
            [Symbol.asyncIterator]: async function* () {
                yield smallChunk;
            },
        } as any;

        const result = await service.upload('../../etc/passwd', mockRequest);

        expect(result).toMatch(/^\/uploads\/\d+_passwd$/);
        expect(result).not.toContain('..');
    });

    it('upload should return path string on success', async () => {
        const content = Buffer.from('file content');
        const mockRequest = {
            [Symbol.asyncIterator]: async function* () {
                yield content;
            },
        } as any;

        const result = await service.upload('document.pdf', mockRequest);

        expect(result).toMatch(/^\/uploads\/\d+_document\.pdf$/);
    });
});
