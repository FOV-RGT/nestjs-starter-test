import { CreateBoxDto, UpdateBoxDto, CreateBoxAliasDto, UpdateBoxAliasDto } from './box.dto.js';
import { BoxService } from './box.service.js';

import { Public } from '@/common/decorators/index.js';

import { Controller, Post, Delete, Get, Put, Body, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('box')
export class BoxController {
    constructor(private readonly boxService: BoxService) {}

    @Post('add')
    async add(@Body() body: CreateBoxDto, @Query('orgID') orgId: string, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        return this.boxService.create(body, orgId, userId);
    }

    @Delete('del')
    async del(@Query('boxID') boxId: string, @Query('orgID') orgId: string) {
        await this.boxService.delete(boxId, orgId);
        return '';
    }

    @Get('list')
    async list(
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.findList(orgId, Number(pageNum) || 1, Number(pageSize) || 10);
    }

    @Get('one')
    async one(@Query('boxID') boxId: string, @Query('orgID') orgId: string) {
        return this.boxService.findOne(boxId, orgId);
    }

    @Public()
    @Get('root/list')
    async rootList(
        @Query('orgID') orgId: string,
        @Query('rootID') rootId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.findByRoom(
            orgId,
            rootId,
            Number(pageNum) || 1,
            Number(pageSize) || 10
        );
    }

    @Public()
    @Get('search')
    async search(
        @Query('c') keyword: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.search(keyword || '', Number(pageNum) || 1, Number(pageSize) || 10);
    }

    @Put('update')
    async update(@Body() body: UpdateBoxDto, @Query('orgID') orgId: string) {
        return this.boxService.update(body, orgId);
    }

    // ===== Alias =====

    @Post('alias/add')
    async addAlias(@Body() body: CreateBoxAliasDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        return this.boxService.createAlias(body, userId);
    }

    @Delete('alias/del')
    async delAlias(
        @Query('boxAliasID') boxAliasId: string,
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string
    ) {
        await this.boxService.deleteAlias(boxAliasId, boxId, orgId);
        return '';
    }

    @Get('alias/list')
    async listAliases(@Query('boxID') boxId: string, @Query('orgID') orgId: string) {
        return this.boxService.listAliases(boxId, orgId);
    }

    @Put('alias/update')
    async updateAlias(@Body() body: UpdateBoxAliasDto) {
        return this.boxService.updateAlias(body);
    }

    // ===== Image =====

    @Post('image/add')
    async addImage(
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string,
        @Query('url') url: string,
        @Req() request: Request
    ) {
        const userId = request.jwtClaim?.sub;
        return this.boxService.addImage(boxId, orgId, url, userId);
    }

    @Get('image/compare')
    async compareImages(@Query('boxID') boxId: string, @Query('orgID') orgId: string) {
        return this.boxService.compareImages(boxId, orgId);
    }

    @Get('image/list')
    async listImages(
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.listImages(
            boxId,
            orgId,
            Number(pageNum) || 1,
            Number(pageSize) || 10
        );
    }

    // ===== Log =====

    @Get('log/list')
    async listLogs(
        @Query('boxID') boxId: string,
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.listLogs(boxId, orgId, Number(pageNum) || 1, Number(pageSize) || 10);
    }

    @Get('log/reagen/list')
    async listReagentLogs(
        @Query('reagentID') reagentId: string,
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.boxService.listReagentLogs(
            reagentId,
            orgId,
            Number(pageNum) || 1,
            Number(pageSize) || 10
        );
    }
}
