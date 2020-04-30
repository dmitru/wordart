import * as tm from 'transformation-matrix'
import {
  HBoundsWasmSerialized,
  HBoundsWasm,
} from 'lib/wordart/wasm/wasm-module'
import paper from 'paper'

export const matrixToPaperTransform = (m?: tm.Matrix): paper.Matrix =>
  m ? new paper.Matrix([m.a, m.b, m.c, m.d, m.e, m.f]) : new paper.Matrix()

export const hBoundsWasmToPaperGroup = (
  hbounds: HBoundsWasm,
  colors: {
    inside: string
    outside: string
  } = {
    inside: 'red',
    outside: 'blue',
  }
): paper.Group => {
  const group = new paper.Group()
  const { inside, outside } = colors

  const impl = (hbounds: HBoundsWasm, transform = tm.identity(), level = 0) => {
    if (level > 7) {
      return
    }
    const bounds = hbounds.get_bounds()
    const boundsPath = new paper.Path.Rectangle(
      new paper.Rectangle(bounds.x, bounds.y, bounds.w, bounds.h)
    ).addTo(group)

    const hboundsJs = hbounds.get_js()
    boundsPath.strokeColor = hboundsJs.overlaps_shape
      ? new paper.Color(inside)
      : new paper.Color(outside)
    boundsPath.transform(matrixToPaperTransform(transform))

    // for (const child of hboundsJs.children) {
    //   const childTransform = tm.compose(
    //     transform,
    //     child.transform || tm.identity()
    //   )
    //   impl(child, childTransform, level + 1)
    // }
  }

  impl(hbounds, tm.identity())

  // console.log('impl / transform = ', hbounds.transform)
  group.transform(matrixToPaperTransform(tm.identity()))

  return group
}

export const hBoundsWasmSerializedToPaperGroup = (
  hbounds: HBoundsWasmSerialized,
  colors: {
    inside: string
    outside: string
  } = {
    inside: 'red',
    outside: 'blue',
  }
): paper.Group => {
  const group = new paper.Group()
  const { inside, outside } = colors

  const impl = (
    hbounds: HBoundsWasmSerialized,
    transform = tm.identity(),
    level = 0
  ) => {
    if (level > 0) {
      return
    }
    const boundsPath = new paper.Path.Rectangle(
      new paper.Rectangle(
        hbounds.bounds.x,
        hbounds.bounds.y,
        hbounds.bounds.w,
        hbounds.bounds.h
      )
    ).addTo(group)

    boundsPath.strokeColor = hbounds.overlaps_shape
      ? new paper.Color(inside)
      : new paper.Color(outside)
    boundsPath.transform(matrixToPaperTransform(transform))

    for (const child of hbounds.children) {
      const childTransform = tm.compose(
        transform,
        child.transform || tm.identity()
      )
      impl(child, childTransform, level + 1)
    }
  }

  impl(hbounds, hbounds.transform || tm.identity())

  console.log('impl / transform = ', hbounds.transform)
  // group.transform(matrixToPaperTransform(hbounds.transform))

  return group
}
