import { ReagentController } from './reagent.controller.js';
import { ReagentService } from './reagent.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ReagentController],
    providers: [ReagentService, DatabaseService],
})
export class ReagentModule {}
