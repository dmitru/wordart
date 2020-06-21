export const animateElement = (
  el: HTMLElement,
  animationClass = 'pulsate-fwd',
  durationMs = 500
) => {
  if (!el) {
    return
  }
  el.classList.remove(animationClass)
  el.classList.add(animationClass)
  setTimeout(() => {
    if (!el) {
      return
    }
    el.classList.remove(animationClass)
  }, durationMs)
}
