import { SvgShapeColorsMapEntry } from 'components/Editor/shape'
import { fabric } from 'fabric'
import { flatten, groupBy, sortBy } from 'lodash'

export const findNamedChildren = (
  item: fabric.Object
): { name: string; item: fabric.Object }[] => {
  const objects = item instanceof fabric.Group ? item.getObjects() : [item]
  const namedChildren = objects.filter((obj) => (obj as any).id != null)
  if (namedChildren.length > 0) {
    return namedChildren.map((child) => ({
      name: (child as any).id,
      item: child,
    }))
  }

  return []
}

/** Recursively finds all fill colors used (ignoring pure black) */
export const getFillColor = (items: fabric.Object[]): string | undefined => {
  for (let item of items) {
    if (typeof item.fill === 'string') {
      return item.fill
    }
  }
  return undefined
}

/** Recursively finds all stroke colors used */
export const getStrokeColor = (items: fabric.Object[]): string | undefined => {
  for (let item of items) {
    if (typeof item.stroke === 'string') {
      return item.stroke
    }
  }
  return undefined
}

export const computeColorsMap = (
  object: fabric.Object
): SvgShapeColorsMapEntry[] => {
  const namedChildren = sortBy(findNamedChildren(object), (c) => c.name)
  const namedChildrenByColor = groupBy(
    namedChildren,
    (ch) => ch.name.split('_')[0]
  )
  // console.log('computeColorsMap', object, namedChildren)

  let colorEntries: SvgShapeColorsMapEntry[] = []
  if (Object.keys(namedChildrenByColor).length > 0) {
    Object.keys(namedChildrenByColor).forEach((colorKey) => {
      const children = namedChildrenByColor[colorKey]
      let fillColor = getFillColor(children.map((c) => c.item))
      let strokeColor = getStrokeColor(children.map((c) => c.item))

      if (fillColor === 'inherit') {
        fillColor = 'black'
      }
      if (strokeColor === 'inherit') {
        strokeColor = 'black'
      }

      if (fillColor !== strokeColor) {
        if (fillColor) {
          colorEntries.push({
            objs: children.map((c) => c.item),
            color: fillColor,
            fill: true,
            stroke: false,
          })
        }
        if (strokeColor) {
          colorEntries.push({
            objs: children.map((c) => c.item),
            color: strokeColor,
            fill: false,
            stroke: true,
          })
        }
      } else {
        if (strokeColor) {
          colorEntries.push({
            objs: children.map((c) => c.item),
            color: strokeColor,
            fill: true,
            stroke: true,
          })
        }
      }
    })
  } else {
    colorEntries.push({
      objs: object instanceof fabric.Group ? object.getObjects() : [object],
      color: '#333',
      stroke: true,
      fill: true,
    })
  }

  // Deduplicate color entries
  const colorEntriesGrouped = groupBy(
    colorEntries,
    (e) => `${e.color}:${e.fill}:${e.stroke}`
  )
  colorEntries = Object.values(colorEntriesGrouped).map((ceGroup) => {
    const ce = ceGroup[0]
    return {
      fill: ce.fill,
      stroke: ce.stroke,
      color: ce.color,
      objs: flatten(ceGroup.map((ce) => ce.objs)),
    } as SvgShapeColorsMapEntry
  })

  // Sort color entries
  colorEntries = sortBy(
    colorEntries,
    (ce) => -(10 * (ce.fill ? 1 : 0) + (ce.stroke ? 1 : 0))
  )

  return colorEntries
}
