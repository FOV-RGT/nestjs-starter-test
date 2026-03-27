import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const CreateFeedbackDtoSchema = z
    .object({
        content: z.string().optional().meta({ description: '反馈内容' }),
        email: z.string().optional().meta({ description: '联系邮箱' }),
        imageList: z.string().optional().meta({ description: '图片列表' }),
        progress: z.number().int().optional().meta({ description: '进度' }),
        type: z.number().int().optional().meta({ description: '类型' }),
    })
    .meta({ description: '新增反馈请求体' });

export class CreateFeedbackDto extends createZodDto(CreateFeedbackDtoSchema) {}
