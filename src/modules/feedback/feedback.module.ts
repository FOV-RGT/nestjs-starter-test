import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [FeedbackController],
    providers: [FeedbackService, DatabaseService],
})
export class FeedbackModule {}
