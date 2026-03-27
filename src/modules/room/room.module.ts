import { RoomController } from './room.controller.js';
import { RoomService } from './room.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [RoomController],
    providers: [RoomService, DatabaseService],
})
export class RoomModule {}
