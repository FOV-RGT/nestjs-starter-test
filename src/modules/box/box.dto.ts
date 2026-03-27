import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

// ===== Box =====
const CreateBoxDtoSchema = z
    .object({
        name: z.string().optional().meta({ description: '盒子名称' }),
        shortName: z.string().optional().meta({ description: '简称' }),
        introduce: z.string().optional().meta({ description: '介绍' }),
        authorityLevel: z.number().int().optional().meta({ description: '权限等级' }),
        way: z.number().int().optional().meta({ description: '方式' }),
        x: z.number().int().optional().meta({ description: 'X 坐标' }),
        y: z.number().int().optional().meta({ description: 'Y 坐标' }),
        rootId: z.string().optional().meta({ description: '房间 ID' }),
    })
    .meta({ description: '创建盒子请求体' });

export class CreateBoxDto extends createZodDto(CreateBoxDtoSchema) {}

const UpdateBoxDtoSchema = z
    .object({
        id: z.string().meta({ description: '盒子 ID' }),
        name: z.string().optional().meta({ description: '盒子名称' }),
        shortName: z.string().optional().meta({ description: '简称' }),
        introduce: z.string().optional().meta({ description: '介绍' }),
        authorityLevel: z.number().int().optional().meta({ description: '权限等级' }),
        way: z.number().int().optional().meta({ description: '方式' }),
        x: z.number().int().optional().meta({ description: 'X 坐标' }),
        y: z.number().int().optional().meta({ description: 'Y 坐标' }),
        rootId: z.string().optional().meta({ description: '房间 ID' }),
    })
    .meta({ description: '更新盒子请求体' });

export class UpdateBoxDto extends createZodDto(UpdateBoxDtoSchema) {}

const DeleteBoxDtoSchema = z
    .object({
        id: z.string().meta({ description: '盒子 ID' }),
    })
    .meta({ description: '删除盒子请求体' });

export class DeleteBoxDto extends createZodDto(DeleteBoxDtoSchema) {}

// ===== BoxAlias =====
const CreateBoxAliasDtoSchema = z
    .object({
        aliasName: z.string().optional().meta({ description: '别名' }),
        boxId: z.string().meta({ description: '盒子 ID' }),
    })
    .meta({ description: '创建盒子别名请求体' });

export class CreateBoxAliasDto extends createZodDto(CreateBoxAliasDtoSchema) {}

const UpdateBoxAliasDtoSchema = z
    .object({
        id: z.string().meta({ description: '别名 ID' }),
        aliasName: z.string().optional().meta({ description: '别名' }),
        boxId: z.string().meta({ description: '盒子 ID' }),
    })
    .meta({ description: '更新盒子别名请求体' });

export class UpdateBoxAliasDto extends createZodDto(UpdateBoxAliasDtoSchema) {}
