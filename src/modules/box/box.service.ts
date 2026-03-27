import { CreateBoxDto, UpdateBoxDto, CreateBoxAliasDto, UpdateBoxAliasDto } from './box.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class BoxService {
    constructor(private readonly databaseService: DatabaseService) {}

    // ===== Box CRUD =====

    async create(dto: CreateBoxDto, orgId: string, userId?: string) {
        return this.databaseService.box.create({
            data: {
                name: dto.name,
                shortName: dto.shortName,
                introduce: dto.introduce,
                authorityLevel: dto.authorityLevel ?? 0,
                way: dto.way ?? 0,
                x: dto.x ?? 0,
                y: dto.y ?? 0,
                rootId: dto.rootId,
                orgId,
                createBy: userId,
            },
        });
    }

    async delete(id: string, orgId: string) {
        const box = await this.databaseService.box.findFirst({ where: { id, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.box.delete({ where: { id } });
    }

    async findList(orgId: string, pageNum: number, pageSize: number) {
        const where = { orgId };
        const [records, total] = await Promise.all([
            this.databaseService.box.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.box.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async findOne(boxId: string, orgId: string) {
        const box = await this.databaseService.box.findFirst({ where: { id: boxId, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return box;
    }

    async findByRoom(orgId: string, rootId: string, pageNum: number, pageSize: number) {
        const where = { orgId, rootId };
        const [records, total] = await Promise.all([
            this.databaseService.box.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.box.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async search(keyword: string, pageNum: number, pageSize: number) {
        const where = {
            OR: [
                { name: { contains: keyword, mode: 'insensitive' as const } },
                { shortName: { contains: keyword, mode: 'insensitive' as const } },
            ],
        };
        const [records, total] = await Promise.all([
            this.databaseService.box.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.box.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async update(dto: UpdateBoxDto, orgId: string) {
        const box = await this.databaseService.box.findFirst({ where: { id: dto.id, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.box.update({
            where: { id: dto.id },
            data: {
                name: dto.name,
                shortName: dto.shortName,
                introduce: dto.introduce,
                authorityLevel: dto.authorityLevel,
                way: dto.way,
                x: dto.x,
                y: dto.y,
                rootId: dto.rootId,
            },
        });
    }

    // ===== BoxAlias =====

    async createAlias(dto: CreateBoxAliasDto, userId?: string) {
        return this.databaseService.boxAlias.create({
            data: {
                aliasName: dto.aliasName,
                boxId: dto.boxId,
                createBy: userId,
            },
        });
    }

    async deleteAlias(boxAliasId: string, boxId: string, _orgId: string) {
        const alias = await this.databaseService.boxAlias.findFirst({
            where: { id: boxAliasId, boxId },
        });
        if (!alias) {
            throw new BusinessException('别名不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.boxAlias.delete({ where: { id: boxAliasId } });
    }

    async listAliases(boxId: string, _orgId: string) {
        return this.databaseService.boxAlias.findMany({ where: { boxId } });
    }

    async updateAlias(dto: UpdateBoxAliasDto) {
        const alias = await this.databaseService.boxAlias.findUnique({ where: { id: dto.id } });
        if (!alias) {
            throw new BusinessException('别名不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.boxAlias.update({
            where: { id: dto.id },
            data: { aliasName: dto.aliasName, boxId: dto.boxId },
        });
    }

    // ===== BoxImage =====

    async addImage(boxId: string, orgId: string, url: string, userId?: string) {
        return this.databaseService.boxImage.create({
            data: { boxId, orgId, url, createBy: userId },
        });
    }

    async compareImages(boxId: string, orgId: string) {
        return this.databaseService.boxImage.findMany({
            where: { boxId, orgId },
            orderBy: { createdAt: 'desc' },
            take: 2,
        });
    }

    async listImages(boxId: string, orgId: string, pageNum: number, pageSize: number) {
        const where = { boxId, orgId };
        const [records, total] = await Promise.all([
            this.databaseService.boxImage.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.boxImage.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    // ===== BoxLog =====

    async listLogs(boxId: string, orgId: string, pageNum: number, pageSize: number) {
        const where = { boxId, orgId };
        const [records, total] = await Promise.all([
            this.databaseService.boxLog.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.boxLog.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async listReagentLogs(reagentId: string, orgId: string, pageNum: number, pageSize: number) {
        const where = { reagentId, orgId };
        const [records, total] = await Promise.all([
            this.databaseService.boxLog.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.boxLog.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }
}
