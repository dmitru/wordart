export function arrayBufferToDataUri(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const blob = new Blob([arrayBuffer])

  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = function (event: ProgressEvent<FileReader>) {
      const base64 = event.target?.result as string
      resolve(base64)
    }

    reader.readAsDataURL(blob)
  })
}
