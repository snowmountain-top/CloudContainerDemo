// zod校验的方法装饰器
import { z, ZodError } from 'zod'
import BizError from '../errors/BizError'

// 自定义错误映射
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.message) return { message: issue.message }

  let message = ''
  const fieldName = issue.path.length > 0 ? `【${issue.path.join('.')}】` : ''

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        message = `${fieldName}为必填字段`
      } else {
        message = `${fieldName}类型错误，期望类型: ${issue.expected}，实际类型: ${issue.received}`
      }
      break
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        message = `${fieldName}字符串长度不能小于 ${issue.minimum} 个字符`
      } else if (issue.type === 'number') {
        message = `${fieldName}数值不能小于 ${issue.minimum}`
      } else if (issue.type === 'array') {
        message = `${fieldName}数组长度不能小于 ${issue.minimum} 项`
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        message = `${fieldName}字符串长度不能大于 ${issue.maximum} 个字符`
      } else if (issue.type === 'number') {
        message = `${fieldName}数值不能大于 ${issue.maximum}`
      } else if (issue.type === 'array') {
        message = `${fieldName}数组长度不能大于 ${issue.maximum} 项`
      }
      break
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        message = `${fieldName}邮箱格式不正确`
      } else if (issue.validation === 'url') {
        message = `${fieldName}URL格式不正确`
      }
      break
    case z.ZodIssueCode.custom:
      message = `${fieldName}验证失败：${issue.message}`
      break
    default:
      message = `${fieldName}${ctx.defaultError}`
  }

  return { message }
}
z.setErrorMap(customErrorMap)

export function ZodFunctionValidate(param: {
  request?: z.ZodSchema
  response?: z.ZodSchema
  needPassthrough?: boolean
}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      let request = args[0]
      if (param.request)
        try {
          request = param.request.parse(args[0])
        } catch (error) {
          if (error instanceof ZodError)
            throw new BizError(`入参: ${error?.issues?.[0]?.message || '参数非法'}`)
          throw error
        }

      let res = await originalMethod.apply(this, [request])

      if (param.response)
        try {
          res = param.response.parse(res)
        } catch (error) {
          throw new BizError(`返回值: ${error?.issues?.[0]?.message || '参数非法'}`)
        }

      return res
    }

    // 设置装饰器返回方法的名称为原始方法的名称
    Object.defineProperty(descriptor.value, 'name', {
      value: originalMethod.name,
      configurable: true,
    })
  }
}
