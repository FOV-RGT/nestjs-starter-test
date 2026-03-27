import { FileService } from './file.service.js';

import { Controller, Put, Query, Req, HttpStatus } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/index.js';
import type { Request } from 'express';

@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) {}

    @Put('upload')
    async upload(@Query('file_name') fileName: string, @Req() request: Request) {
        if (!fileName) {
            throw new BusinessException(
                '文件名不能为空',
                'VALIDATION_FAILED',
                HttpStatus.BAD_REQUEST
            );
        }
        return this.fileService.upload(fileName, request);
    }
}
