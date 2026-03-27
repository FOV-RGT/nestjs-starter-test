import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateOrgDtoSchema = z
    .object({
        name: z.string().min(1).meta({ description: '组织名称' }),
        introduce: z.string().optional().meta({ description: '介绍' }),
    })
    .meta({ description: '创建组织请求体' });

export class CreateOrgDto extends createZodDto(CreateOrgDtoSchema) {}

const UpdateOrgDtoSchema = z
    .object({
        id: z.string().meta({ description: '组织 ID' }),
        name: z.string().optional().meta({ description: '组织名' }),
        introduce: z.string().optional().meta({ description: '介绍' }),
    })
    .meta({ description: '更新组织请求体' });

export class UpdateOrgDto extends createZodDto(UpdateOrgDtoSchema) {}
