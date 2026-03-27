import { CreateOrgDto, UpdateOrgDto } from './organization.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class OrganizationService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(dto: CreateOrgDto, userId: string) {
        const org = await this.databaseService.organization.create({
            data: {
                name: dto.name,
                introduce: dto.introduce,
                createBy: userId,
                member: 1,
            },
        });

        // 创建者自动成为管理员
        await this.databaseService.orgUser.create({
            data: {
                orgId: org.id,
                userId,
                role: 1, // 管理员
                status: 1, // 已加入
            },
        });

        return org;
    }

    async delete(orgId: string, userId: string) {
        const org = await this.databaseService.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new BusinessException('组织不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        if (org.createBy !== userId) {
            throw new BusinessException(
                '只有创建者可以删除组织',
                'FORBIDDEN',
                HttpStatus.FORBIDDEN
            );
        }
        await this.databaseService.organization.delete({ where: { id: orgId } });
    }

    async findUserOrgs(userId: string) {
        const memberships = await this.databaseService.orgUser.findMany({
            where: { userId, status: 1 },
            include: { organization: true },
        });
        return memberships.map((m) => m.organization);
    }

    async findOne(orgId: string) {
        const org = await this.databaseService.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new BusinessException('组织不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return org;
    }

    async search(name: string, pageNum: number, pageSize: number) {
        const where = { name: { contains: name, mode: 'insensitive' as const } };
        const [records, total] = await Promise.all([
            this.databaseService.organization.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.databaseService.organization.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async update(dto: UpdateOrgDto, _userId: string) {
        const org = await this.databaseService.organization.findUnique({ where: { id: dto.id } });
        if (!org) {
            throw new BusinessException('组织不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.organization.update({
            where: { id: dto.id },
            data: {
                name: dto.name,
                introduce: dto.introduce,
            },
        });
    }
}
