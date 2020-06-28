export function fireEventForEl(el: HTMLElement, etype: string) {
  // @ts-ignore
  if (el.fireEvent) {
    // @ts-ignore
    el.fireEvent('on' + etype)
  } else {
    var evObj = document.createEvent('Events')
    evObj.initEvent(etype, true, false)
    el.dispatchEvent(evObj)
  }
}
