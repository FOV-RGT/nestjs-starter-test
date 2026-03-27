import { CreateRoomDto, UpdateRoomDto, DeleteRoomDto } from './room.dto.js';
import { RoomService } from './room.service.js';

import { Controller, Post, Delete, Get, Put, Body, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('root')
export class RoomController {
    constructor(private readonly roomService: RoomService) {}

    @Post('add')
    async add(@Body() body: CreateRoomDto, @Query('orgID') orgId: string, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        return this.roomService.create(body, orgId, userId);
    }

    @Delete('del')
    async del(@Body() body: DeleteRoomDto, @Query('orgID') orgId: string) {
        return this.roomService.delete(body.id, orgId);
    }

    @Get('list')
    async list(
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string,
        @Query('parentID') parentId?: string
    ) {
        return this.roomService.findList(
            orgId,
            parentId,
            Number(pageNum) || 1,
            Number(pageSize) || 10
        );
    }

    @Get('one')
    async one(@Query('rootID') rootId: string, @Query('orgID') orgId: string) {
        return this.roomService.findOne(rootId, orgId);
    }

    @Put('update')
    async update(@Body() body: UpdateRoomDto, @Query('orgID') orgId: string) {
        return this.roomService.update(body, orgId);
    }
}
