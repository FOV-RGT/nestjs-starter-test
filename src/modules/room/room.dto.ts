import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateRoomDtoSchema = z
    .object({
        roomName: z.string().optional().meta({ description: '房间名称' }),
        roomDescribe: z.string().optional().meta({ description: '房间描述' }),
        parentId: z.string().optional().meta({ description: '父房间 ID' }),
    })
    .meta({ description: '新增房间请求体' });

export class CreateRoomDto extends createZodDto(CreateRoomDtoSchema) {}

const UpdateRoomDtoSchema = z
    .object({
        id: z.string().meta({ description: '房间 ID' }),
        roomName: z.string().optional().meta({ description: '房间名称' }),
        roomDescribe: z.string().optional().meta({ description: '房间描述' }),
        parentId: z.string().optional().meta({ description: '父房间 ID' }),
    })
    .meta({ description: '更新房间请求体' });

export class UpdateRoomDto extends createZodDto(UpdateRoomDtoSchema) {}

const DeleteRoomDtoSchema = z
    .object({
        id: z.string().meta({ description: '房间 ID' }),
    })
    .meta({ description: '删除房间请求体' });

export class DeleteRoomDto extends createZodDto(DeleteRoomDtoSchema) {}
