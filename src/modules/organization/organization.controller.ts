import { CreateOrgDto, UpdateOrgDto } from './organization.dto.js';
import { OrganizationService } from './organization.service.js';
import { OrgUserService } from './org-user.service.js';

import { Public } from '@/common/decorators/index.js';

import { Controller, Post, Delete, Get, Put, Body, Query, Req, HttpStatus } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/index.js';
import type { Request } from 'express';

@Controller('org')
export class OrganizationController {
    constructor(
        private readonly organizationService: OrganizationService,
        private readonly orgUserService: OrgUserService
    ) {}

    @Post('create')
    async create(@Body() body: CreateOrgDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.organizationService.create(body, userId);
    }

    @Delete('del')
    async del(@Query('orgID') orgId: string, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.organizationService.delete(orgId, userId);
        return '';
    }

    @Get('list')
    async list(@Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.organizationService.findUserOrgs(userId);
    }

    @Get('one')
    async one(@Query('orgID') orgId: string) {
        return this.organizationService.findOne(orgId);
    }

    @Public()
    @Get('search')
    async search(
        @Query('name') name: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.organizationService.search(
            name || '',
            Number(pageNum) || 1,
            Number(pageSize) || 10
        );
    }

    @Put('update')
    async update(@Body() body: UpdateOrgDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.organizationService.update(body, userId);
    }

    // ===== OrgUser =====

    @Put('user/apply')
    async apply(
        @Query('orgID') orgId: string,
        @Query('ms') message: string,
        @Req() request: Request
    ) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.orgUserService.apply(orgId, message || '', userId);
        return '';
    }

    @Put('user/apply/ac')
    async approveApplication(@Query('orgID') orgId: string, @Query('userID') targetUserId: string) {
        await this.orgUserService.approveApplication(orgId, targetUserId);
        return '';
    }

    @Get('user/apply/ms')
    async applicationMessages(@Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.orgUserService.getApplicationMessages(userId);
    }

    @Delete('user/del')
    async kickUser(@Query('orgID') orgId: string, @Query('userID') targetUserId: string) {
        await this.orgUserService.kickUser(orgId, targetUserId);
        return '';
    }

    @Put('user/invite')
    async invite(
        @Query('orgID') orgId: string,
        @Query('uid') uid: string,
        @Req() request: Request
    ) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.orgUserService.invite(orgId, uid, userId);
        return '';
    }

    @Put('user/invite/ac')
    async acceptInvite(@Query('orgID') orgId: string, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.orgUserService.acceptInvite(orgId, userId);
        return '';
    }

    @Get('user/invite/ms')
    async inviteMessages(@Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.orgUserService.getInviteMessages(userId);
    }

    @Get('user/list')
    async listUserOrgs(@Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.orgUserService.listUserOrgs(userId);
    }

    @Get('user/member/list')
    async listMembers(
        @Query('orgID') orgId: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.orgUserService.listMembers(orgId, Number(pageNum) || 1, Number(pageSize) || 10);
    }

    @Delete('user/quit')
    async quit(@Query('orgID') orgId: string, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.orgUserService.quit(orgId, userId);
        return '';
    }

    @Put('user/updateAuthority')
    async updateAuthority(
        @Query('orgID') orgId: string,
        @Query('userID') targetUserId: string,
        @Query('role') role: string
    ) {
        await this.orgUserService.updateAuthority(orgId, targetUserId, Number(role));
        return '';
    }
}
