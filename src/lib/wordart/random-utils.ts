export const weightedSample = (weights: number[]): number => {
  let totalWeight = 0

  for (let i = 0; i < weights.length; i++) {
    totalWeight += weights[i]
  }

  let random = Math.random() * totalWeight

  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      return i
    }

    random -= weights[i]
  }

  return -1
}
