/**
 * Allows to do exhaustive type checks for discriminated union types in if-else & switch-case statements.
 * See https://dev.to/babak/exhaustive-type-checking-with-typescript-4l3f
 * */
export function exhaustiveCheck(param: never): never {
  throw new Error('exhaustiveCheck: should not reach here')
}
