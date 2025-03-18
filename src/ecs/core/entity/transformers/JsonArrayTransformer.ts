import { ValueTransformer } from 'typeorm'

export default class JsonArrayTransformer implements ValueTransformer {
  to(value: any): string {
    return value
  }

  from(value: string | any[]): any[] {
    if (Array.isArray(value)) {
      return value.map((item) => {
        return typeof item === 'string' ? JSON.parse(item) : item
      })
    }
    if (typeof value === 'string') {
      return JSON.parse(value)
    }
    return value
  }
}
