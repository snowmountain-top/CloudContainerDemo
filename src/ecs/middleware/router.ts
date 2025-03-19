import { Request, Response } from 'express'
import stringUtils from '@be-link/common-sdk/utils/string'
import rTracer from 'cls-rtracer'
import { isRawResponse } from '../utils/rawResponse'

/**
 * 转换原始controller实现为方法级别的路由
 * 仅支持POST方法, 且参数为JSON格式
 */
export function transfer(controller: Function, controllerInstance: any): [string, any] {
  return [
    `/${stringUtils.camelToKebabCase(controller.name)}`,
    async function (req: Request, res: Response) {
      const body = req.body
      const result = await controller(body, req, res)

      // 检查是否需要跳过标准返回值格式
      if (isRawResponse(controllerInstance, controller.name)) {
        res.json(result)
      } else {
        res.json({
          data: result,
          message: 'success',
          success: true,
          requestId: rTracer.id(),
        })
      }
    },
  ]
}
