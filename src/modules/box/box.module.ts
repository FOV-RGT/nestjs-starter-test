import { BoxController } from './box.controller.js';
import { BoxService } from './box.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [BoxController],
    providers: [BoxService, DatabaseService],
})
export class BoxModule {}
