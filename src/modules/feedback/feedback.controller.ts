import { CreateFeedbackDto } from './feedback.dto.js';
import { FeedbackService } from './feedback.service.js';

import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    @Post('add')
    async add(@Body() body: CreateFeedbackDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        return this.feedbackService.create(body, userId);
    }
}
