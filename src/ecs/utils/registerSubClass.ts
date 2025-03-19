import 'reflect-metadata'
const SUBCLASS_METADATA_KEY = Symbol('subclasses')

export function RegisterSubclass(target: Function) {
  const parent = Object.getPrototypeOf(target.prototype).constructor
  const existingSubclasses = Reflect.getOwnMetadata(SUBCLASS_METADATA_KEY, parent) || []
  Reflect.defineMetadata(SUBCLASS_METADATA_KEY, [...existingSubclasses, target], parent)
}

export function getSubclasses(parent: Function) {
  return Reflect.getOwnMetadata(SUBCLASS_METADATA_KEY, parent) || []
}
