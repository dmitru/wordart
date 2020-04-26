export const sleep = (sleepMs: number): Promise<void> =>
  sleepMs === 0
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, sleepMs))

export const waitAnimationFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()))
