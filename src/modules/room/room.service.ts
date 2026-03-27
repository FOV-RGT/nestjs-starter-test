import { CreateRoomDto, UpdateRoomDto } from './room.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class RoomService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(dto: CreateRoomDto, orgId: string, userId?: string) {
        return this.databaseService.room.create({
            data: {
                roomName: dto.roomName,
                roomDescribe: dto.roomDescribe,
                parentId: dto.parentId,
                orgId,
                createBy: userId,
            },
        });
    }

    async delete(id: string, orgId: string) {
        const room = await this.databaseService.room.findFirst({
            where: { id, orgId },
        });
        if (!room) {
            throw new BusinessException('房间不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.room.delete({ where: { id } });
    }

    async findList(orgId: string, parentId: string | undefined, pageNum: number, pageSize: number) {
        const where: any = { orgId };
        if (parentId) {
            where.parentId = parentId;
        }
        const [data, total] = await Promise.all([
            this.databaseService.room.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.room.count({ where }),
        ]);
        return { records: data, total, pageNum, pageSize };
    }

    async findOne(id: string, orgId: string) {
        const room = await this.databaseService.room.findFirst({
            where: { id, orgId },
        });
        if (!room) {
            throw new BusinessException('房间不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return room;
    }

    async update(dto: UpdateRoomDto, orgId: string) {
        const room = await this.databaseService.room.findFirst({
            where: { id: dto.id, orgId },
        });
        if (!room) {
            throw new BusinessException('房间不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.room.update({
            where: { id: dto.id },
            data: {
                roomName: dto.roomName,
                roomDescribe: dto.roomDescribe,
                parentId: dto.parentId,
            },
        });
    }
}
