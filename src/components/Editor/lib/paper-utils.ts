import * as tm from 'transformation-matrix'
import {
  HBoundsWasmSerialized,
  HBoundsWasm,
} from 'lib/wordart/wasm/wasm-module'
import paper from 'paper'
import { flatten } from 'lodash'

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

  // console.log('impl / transform = ', hbounds.transform)
  // group.transform(matrixToPaperTransform(hbounds.transform))

  return group
}

/** Recursively finds all fill colors used (ignoring pure black) */
export const getFillColor = (
  items: paper.Item[],
  level = 0,
  maxLevel = 6
): paper.Color | undefined => {
  for (let item of items) {
    if (item.fillColor) {
      return item.fillColor
    }
    if (item.children && level < maxLevel) {
      const color = getFillColor(item.children, level + 1)
      if (color && color.red * color.green * color.blue > 0) {
        return color
      }
    }
  }
  return undefined
}

/** Recursively finds all stroke colors used */
export const getStrokeColor = (
  items: paper.Item[],
  level = 0,
  maxLevel = 6
): paper.Color | undefined => {
  for (let item of items) {
    if (item.strokeColor) {
      return item.strokeColor
    }
    if (item.children && level < maxLevel) {
      const color = getStrokeColor(item.children, level + 1)
      if (color) {
        return color
      }
    }
  }
  return undefined
}

/** Find all children Items with IDs */
export const findNamedChildren = (
  item: paper.Item,
  level = 0,
  maxLevel = 6
): { name: string; item: paper.Item }[] => {
  const namedChildren = (item as any)._namedChildren as
    | { [key: string]: paper.Item[] }
    | undefined
  if (namedChildren && Object.keys(namedChildren).length > 0) {
    return Object.keys(namedChildren).map((name) => ({
      name,
      item: namedChildren[name][0],
    }))
  }
  if (item.children && level < maxLevel) {
    const resultsForChildren = item.children.map((i) =>
      findNamedChildren(i, level + 1)
    )
    return flatten(resultsForChildren)
  }

  return []
}
