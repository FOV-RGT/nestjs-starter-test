import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const EmailCodeQuerySchema = z
    .object({
        email: z.email().meta({ description: '邮箱' }),
    })
    .meta({ description: '发送邮箱验证码查询参数' });

export class EmailCodeQueryDto extends createZodDto(EmailCodeQuerySchema) {}

const EmailLoginDtoSchema = z
    .object({
        email: z.email().meta({ description: '邮箱' }),
        code: z.string().min(1).meta({ description: '验证码' }),
    })
    .meta({ description: '邮箱验证码登录请求体' });

export class EmailLoginDto extends createZodDto(EmailLoginDtoSchema) {}

const EmailUpdatePasswordDtoSchema = z
    .object({
        email: z.email().meta({ description: '邮箱' }),
        code: z.string().min(1).meta({ description: '验证码' }),
        newPassword: z.string().min(8).max(128).meta({ description: '新密码' }),
    })
    .meta({ description: '邮箱验证码修改密码请求体' });

export class EmailUpdatePasswordDto extends createZodDto(EmailUpdatePasswordDtoSchema) {}

const UserRegisterDtoSchema = z
    .object({
        account: z.email().meta({ description: '邮箱' }),
        code: z.string().optional().meta({ description: '验证码' }),
        nickName: z.string().optional().meta({ description: '昵称' }),
        password: z.string().min(8).max(128).meta({ description: '密码' }),
        realName: z.string().optional().meta({ description: '真实姓名' }),
    })
    .meta({ description: '用户注册请求体' });

export class UserRegisterDto extends createZodDto(UserRegisterDtoSchema) {}

const UserLoginDtoSchema = z
    .object({
        account: z.string().min(1).meta({ description: '账号' }),
        password: z.string().min(1).meta({ description: '密码' }),
    })
    .meta({ description: '用户登录请求体' });

export class UserLoginDto extends createZodDto(UserLoginDtoSchema) {}

const UpdateInfoDtoSchema = z
    .object({
        nickName: z.string().optional().meta({ description: '昵称' }),
        realName: z.string().optional().meta({ description: '真实姓名' }),
    })
    .meta({ description: '修改个人信息请求体' });

export class UpdateInfoDto extends createZodDto(UpdateInfoDtoSchema) {}

const UpdatePasswordDtoSchema = z
    .object({
        oldPassword: z.string().min(1).meta({ description: '原密码' }),
        newPassword: z.string().min(8).max(128).meta({ description: '新密码' }),
    })
    .meta({ description: '修改密码请求体' });

export class UpdatePasswordDto extends createZodDto(UpdatePasswordDtoSchema) {}

const UpdateEmailDtoSchema = z
    .object({
        code: z.string().min(1).meta({ description: '验证码' }),
        newEmail: z.email().meta({ description: '新邮箱' }),
    })
    .meta({ description: '修改邮箱请求体' });

export class UpdateEmailDto extends createZodDto(UpdateEmailDtoSchema) {}
