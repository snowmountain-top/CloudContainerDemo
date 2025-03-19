import 'reflect-metadata'
const RAW_RESPONSE_METADATA_KEY = Symbol('raw-response')

// 跳过标准返回值格式的装饰器
export function RawResponse() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(
      RAW_RESPONSE_METADATA_KEY,
      true,
      target.constructor.prototype,
      propertyKey,
    )
    return descriptor
  }
}

export function isRawResponse(target: any, propertyKey: string) {
  return Reflect.getMetadata(RAW_RESPONSE_METADATA_KEY, target.constructor.prototype, propertyKey)
}
