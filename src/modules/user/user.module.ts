import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { EmailCodeService } from './email-code.service.js';

import { TokenService } from '@/modules/auth/services/index.js';
import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [UserController],
    providers: [UserService, EmailCodeService, TokenService, DatabaseService],
})
export class UserModule {}
