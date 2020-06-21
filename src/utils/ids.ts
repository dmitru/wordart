import { nanoid } from 'nanoid/non-secure'

export class UniqIdGenerator {
  curLen: number
  startLen: number
  ids = new Set<string>()

  constructor(startLen: number = 3) {
    this.curLen = startLen
    this.startLen = startLen
  }

  addIds = (ids: string[]) => {
    ids.forEach((id) => this.ids.add(id))
  }

  get = (): string => {
    let candidate = nanoid(this.curLen)
    let attempt = 1
    while (this.ids.has(candidate)) {
      candidate = nanoid(this.curLen)
      attempt += 1
      if (attempt > 5) {
        this.curLen += 1
        attempt = 0
      }
    }
    this.ids.add(candidate)
    return candidate
  }

  removeIds = (ids: string[]) => {
    ids.forEach((id) => this.ids.delete(id))
  }

  resetLen = () => {
    this.curLen = this.startLen
  }

  clear = () => {
    this.curLen = this.startLen
    this.ids.clear()
  }
}
