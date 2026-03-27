import { Injectable, HttpStatus } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/index.js';
import type { Request } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class FileService {
    async upload(fileName: string, request: Request): Promise<string> {
        const chunks: Buffer[] = [];
        for await (const chunk of request as any) {
            chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
            throw new BusinessException(
                '文件不能为空',
                'VALIDATION_FAILED',
                HttpStatus.BAD_REQUEST
            );
        }

        if (buffer.length > MAX_FILE_SIZE) {
            throw new BusinessException(
                '文件大小不能超过10MB',
                'VALIDATION_FAILED',
                HttpStatus.BAD_REQUEST
            );
        }

        // 防止路径遍历：只取文件名部分
        const safeName = path.basename(fileName);
        const uniqueName = `${Date.now()}_${safeName}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);

        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(filePath, buffer);

        return `/uploads/${uniqueName}`;
    }
}
