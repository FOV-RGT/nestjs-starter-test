import { CreateFeedbackDto } from './feedback.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedbackService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(dto: CreateFeedbackDto, userId?: string) {
        return this.databaseService.feedback.create({
            data: {
                content: dto.content,
                email: dto.email,
                imageList: dto.imageList,
                progress: dto.progress ?? 0,
                type: dto.type ?? 0,
                createBy: userId,
            },
        });
    }
}
