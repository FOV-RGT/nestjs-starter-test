import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { OrgUserService } from './org-user.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [OrganizationController],
    providers: [OrganizationService, OrgUserService, DatabaseService],
})
export class OrganizationModule {}
