import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const ReagentOperateDtoSchema = z
    .object({
        id: z.string().optional().meta({ description: '试剂 ID' }),
        boxId: z.string().optional().meta({ description: '盒子 ID' }),
        name: z.string().optional().meta({ description: '名称' }),
        operateType: z.number().int().optional().meta({ description: '操作类型' }),
        remark: z.string().optional().meta({ description: '备注' }),
        x: z.number().int().optional().meta({ description: 'X 坐标' }),
        y: z.number().int().optional().meta({ description: 'Y 坐标' }),
    })
    .meta({ description: '试剂操作请求体' });

const BatchUpdateReagentsDtoSchema = z.array(ReagentOperateDtoSchema).meta({
    description: '批量更新试剂请求体',
});

export class BatchUpdateReagentsDto extends createZodDto(
    z.object({ items: BatchUpdateReagentsDtoSchema })
) {}

export type ReagentOperateItem = z.infer<typeof ReagentOperateDtoSchema>;
