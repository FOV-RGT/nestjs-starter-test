import type { ReagentOperateItem } from './reagent.dto.js';

import { DatabaseService } from '@/infra/database/database.service.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class ReagentService {
    constructor(private readonly databaseService: DatabaseService) {}

    async findByBox(boxId: string, orgId: string) {
        // 确认盒子属于该组织
        const box = await this.databaseService.box.findFirst({ where: { id: boxId, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return this.databaseService.reagent.findMany({ where: { boxId } });
    }

    async findOne(reagentId: string, boxId: string, orgId: string) {
        const box = await this.databaseService.box.findFirst({ where: { id: boxId, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        const reagent = await this.databaseService.reagent.findFirst({
            where: { id: reagentId, boxId },
        });
        if (!reagent) {
            throw new BusinessException('试剂不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        return reagent;
    }

    async batchUpdate(items: ReagentOperateItem[], boxId: string, orgId: string, userId?: string) {
        const box = await this.databaseService.box.findFirst({ where: { id: boxId, orgId } });
        if (!box) {
            throw new BusinessException('盒子不存在', 'RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        for (const item of items) {
            if (item.operateType === 1) {
                // 新增
                await this.databaseService.reagent.create({
                    data: {
                        name: item.name,
                        remark: item.remark,
                        x: item.x ?? 0,
                        y: item.y ?? 0,
                        boxId,
                    },
                });
            } else if (item.operateType === 2 && item.id) {
                // 更新
                await this.databaseService.reagent.update({
                    where: { id: item.id },
                    data: {
                        name: item.name,
                        remark: item.remark,
                        x: item.x,
                        y: item.y,
                    },
                });
            } else if (item.operateType === 3 && item.id) {
                // 删除
                await this.databaseService.reagent.delete({ where: { id: item.id } });
            }

            // 记录操作日志
            await this.databaseService.boxLog.create({
                data: {
                    boxId,
                    orgId,
                    action: `reagent_operate_${item.operateType}`,
                    reagentId: item.id,
                    userId,
                },
            });
        }
    }
}
