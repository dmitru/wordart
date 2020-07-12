export const injectScript = (scriptSrc: string): Promise<void> => {
  return new Promise((resolve) => {
    const script = document.createElement('script')

    script.async = true
    script.defer = true
    script.src = scriptSrc
    script.onload = () => resolve()

    if (document.head) {
      document.head.appendChild(script)
    }
  })
}

export const isAnyScriptPresent = (regex: RegExp): boolean =>
  // @ts-ignore
  Array.from(document.scripts).reduce(
    // @ts-ignore
    (isPresent, script) => (isPresent ? isPresent : regex.test(script.src)),
    false
  )
