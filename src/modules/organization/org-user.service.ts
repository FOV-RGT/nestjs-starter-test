import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class OrgUserService {
    constructor(private readonly databaseService: DatabaseService) {}

    async apply(orgId: string, message: string, userId: string) {
        const org = await this.databaseService.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new BusinessException('组织不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        const existing = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });
        if (existing && existing.status === 1) {
            throw new BusinessException('已经是组织成员', 'RESOURCE_CONFLICT', HttpStatus.CONFLICT);
        }

        if (existing) {
            return this.databaseService.orgUser.update({
                where: { id: existing.id },
                data: { status: 0, message, inviteType: 'apply' },
            });
        }

        return this.databaseService.orgUser.create({
            data: { orgId, userId, status: 0, message, inviteType: 'apply' },
        });
    }

    async approveApplication(orgId: string, targetUserId: string) {
        const membership = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId: targetUserId } },
        });
        if (!membership || membership.inviteType !== 'apply') {
            throw new BusinessException('申请不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        await this.databaseService.orgUser.update({
            where: { id: membership.id },
            data: { status: 1 },
        });

        await this.databaseService.organization.update({
            where: { id: orgId },
            data: { member: { increment: 1 } },
        });
    }

    async getApplicationMessages(userId: string) {
        // 获取用户管理的组织的待处理申请
        const adminOrgs = await this.databaseService.orgUser.findMany({
            where: { userId, role: 1, status: 1 },
            select: { orgId: true },
        });
        const orgIds = adminOrgs.map((o) => o.orgId);

        return this.databaseService.orgUser.findMany({
            where: {
                orgId: { in: orgIds },
                inviteType: 'apply',
                status: 0,
            },
            include: {
                user: { select: { id: true, username: true, nickName: true } },
                organization: true,
            },
        });
    }

    async kickUser(orgId: string, targetUserId: string) {
        const membership = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId: targetUserId } },
        });
        if (!membership) {
            throw new BusinessException('成员不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        await this.databaseService.orgUser.delete({ where: { id: membership.id } });
        await this.databaseService.organization.update({
            where: { id: orgId },
            data: { member: { decrement: 1 } },
        });
    }

    async invite(orgId: string, uid: string, _userId: string) {
        const targetUser = await this.databaseService.user.findFirst({ where: { uid } });
        if (!targetUser) {
            throw new BusinessException('用户不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        const existing = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId: targetUser.id } },
        });
        if (existing && existing.status === 1) {
            throw new BusinessException(
                '用户已是组织成员',
                'RESOURCE_CONFLICT',
                HttpStatus.CONFLICT
            );
        }

        if (existing) {
            return this.databaseService.orgUser.update({
                where: { id: existing.id },
                data: { status: 0, inviteType: 'invite' },
            });
        }

        return this.databaseService.orgUser.create({
            data: { orgId, userId: targetUser.id, status: 0, inviteType: 'invite' },
        });
    }

    async acceptInvite(orgId: string, userId: string) {
        const membership = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });
        if (!membership || membership.inviteType !== 'invite' || membership.status !== 0) {
            throw new BusinessException('邀请不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        await this.databaseService.orgUser.update({
            where: { id: membership.id },
            data: { status: 1 },
        });

        await this.databaseService.organization.update({
            where: { id: orgId },
            data: { member: { increment: 1 } },
        });
    }

    async getInviteMessages(userId: string) {
        return this.databaseService.orgUser.findMany({
            where: { userId, inviteType: 'invite', status: 0 },
            include: { organization: true },
        });
    }

    async listUserOrgs(userId: string) {
        const memberships = await this.databaseService.orgUser.findMany({
            where: { userId, status: 1 },
            include: { organization: true },
        });
        return memberships.map((m) => m.organization);
    }

    async listMembers(orgId: string, pageNum: number, pageSize: number) {
        const where = { orgId, status: 1 };
        const [records, total] = await Promise.all([
            this.databaseService.orgUser.findMany({
                where,
                skip: (pageNum - 1) * pageSize,
                take: pageSize,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            nickName: true,
                            realName: true,
                            uid: true,
                        },
                    },
                },
            }),
            this.databaseService.orgUser.count({ where }),
        ]);
        return { records, total, pageNum, pageSize };
    }

    async quit(orgId: string, userId: string) {
        const membership = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });
        if (!membership) {
            throw new BusinessException('未加入该组织', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        await this.databaseService.orgUser.delete({ where: { id: membership.id } });
        await this.databaseService.organization.update({
            where: { id: orgId },
            data: { member: { decrement: 1 } },
        });
    }

    async updateAuthority(orgId: string, targetUserId: string, role: number) {
        const membership = await this.databaseService.orgUser.findUnique({
            where: { orgId_userId: { orgId, userId: targetUserId } },
        });
        if (!membership) {
            throw new BusinessException('成员不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        return this.databaseService.orgUser.update({
            where: { id: membership.id },
            data: { role },
        });
    }
}
