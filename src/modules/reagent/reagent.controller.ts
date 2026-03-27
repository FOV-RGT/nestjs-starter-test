import { ReagentService } from './reagent.service.js';

import { Controller, Post, Get, Body, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('reagent')
export class ReagentController {
    constructor(private readonly reagentService: ReagentService) {}

    @Get('list')
    async list(@Query('boxID') boxId: string, @Query('orgID') orgId: string) {
        return this.reagentService.findByBox(boxId, orgId);
    }

    @Get('one')
    async one(
        @Query('reagentID') reagentId: string,
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string
    ) {
        return this.reagentService.findOne(reagentId, boxId, orgId);
    }

    @Post('update')
    async batchUpdate(
        @Body() body: any[],
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string,
        @Req() request: Request
    ) {
        const userId = request.jwtClaim?.sub;
        await this.reagentService.batchUpdate(body, boxId, orgId, userId);
        return '';
    }
}
