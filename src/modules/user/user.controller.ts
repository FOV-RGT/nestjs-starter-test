import {
    UserRegisterDto,
    UserLoginDto,
    EmailLoginDto,
    EmailUpdatePasswordDto,
    EmailCodeQueryDto,
    UpdateInfoDto,
    UpdatePasswordDto,
    UpdateEmailDto,
} from './user.dto.js';
import { UserService } from './user.service.js';

import { Public } from '@/common/decorators/index.js';

import { Controller, Post, Get, Put, Body, Query, Req, HttpStatus } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/index.js';
import type { Request } from 'express';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Public()
    @Post('register')
    async register(@Body() body: UserRegisterDto) {
        return this.userService.register(body);
    }

    @Public()
    @Post('login')
    async login(@Body() body: UserLoginDto) {
        return this.userService.login(body);
    }

    @Public()
    @Get('email/code')
    async emailCode(@Query() query: EmailCodeQueryDto) {
        await this.userService.sendEmailCode(query.email);
        return '';
    }

    @Public()
    @Post('email/login')
    async emailLogin(@Body() body: EmailLoginDto) {
        return this.userService.emailLogin(body);
    }

    @Public()
    @Put('email/update/password')
    async emailUpdatePassword(@Body() body: EmailUpdatePasswordDto) {
        await this.userService.emailUpdatePassword(body);
        return '';
    }

    @Get('info')
    async info(@Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        return this.userService.getUserInfo(userId);
    }

    @Get('search')
    async search(
        @Query('s') s: string,
        @Query('pageNum') pageNum: string,
        @Query('pageSize') pageSize: string
    ) {
        return this.userService.searchUsers(s || '', Number(pageNum) || 1, Number(pageSize) || 10);
    }

    @Put('update/email')
    async updateEmail(@Body() body: UpdateEmailDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.userService.updateEmail(userId, body);
        return '';
    }

    @Put('update/info')
    async updateInfo(@Body() body: UpdateInfoDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.userService.updateInfo(userId, body);
        return '';
    }

    @Put('update/password')
    async updatePassword(@Body() body: UpdatePasswordDto, @Req() request: Request) {
        const userId = request.jwtClaim?.sub;
        if (!userId) {
            throw new BusinessException('未登录', 'AUTH_FAILED', HttpStatus.UNAUTHORIZED);
        }
        await this.userService.updatePassword(userId, body);
        return '';
    }
}
