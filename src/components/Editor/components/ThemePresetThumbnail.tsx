import { Box } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { ThemePreset } from 'components/Editor/style'
import { Theme } from 'chakra'

export const ThemePresetThumbnail: React.FC<{ theme: ThemePreset }> = ({
  theme,
}) => {
  let shapeItemsColors = ['black']
  if (theme.shapeItemsColoring.kind === 'color') {
    shapeItemsColors = theme.shapeItemsColoring.colors
  } else if (theme.shapeItemsColoring.kind === 'gradient') {
    shapeItemsColors = [
      theme.shapeItemsColoring.gradient.from,
      theme.shapeItemsColoring.gradient.to,
    ]
  } else if (theme.shapeItemsColoring.kind === 'shape') {
    shapeItemsColors = [theme.shapeFill]
  }

  let bgItemsColors = ['black']
  if (theme.bgItemsColoring.kind === 'color') {
    bgItemsColors = theme.bgItemsColoring.colors
  } else if (theme.bgItemsColoring.kind === 'gradient') {
    bgItemsColors = [
      theme.bgItemsColoring.gradient.from,
      theme.bgItemsColoring.gradient.to,
    ]
  }

  let shapeItemsColorIndex = 0
  const getShapeItemsColor = () => {
    shapeItemsColorIndex = (shapeItemsColorIndex + 1) % shapeItemsColors.length
    return shapeItemsColors[shapeItemsColorIndex]
  }

  let bgItemsColorIndex = 0
  const getBgItemsColor = () => {
    bgItemsColorIndex = (bgItemsColorIndex + 1) % bgItemsColors.length
    return bgItemsColors[bgItemsColorIndex]
  }

  return (
    <svg
      width="100px"
      height="76px"
      viewBox="0 0 319 240"
      version="1.1"
      style={{ border: '1px solid #888' }}
    >
      <g
        id="Page-1"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g id="Group-2">
          <rect
            id="Rectangle"
            fill={theme.bgFill}
            x="0"
            y="0"
            width="319"
            height="240"
          ></rect>
          <g id="Group" transform="translate(50.000000, 51.000000)">
            <rect
              id="Rectangle"
              fill={theme.shapeFill}
              opacity={theme.shapeOpacity / 100}
              x="0"
              y="0"
              width="218"
              height="140"
              rx="29"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="16"
              y="29"
              width="112"
              height="21"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="68"
              y="67"
              width="84"
              height="17"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="56"
              y="99"
              width="72"
              height="22"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="152"
              y="33"
              width="54"
              height="17"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="168"
              y="80"
              width="23"
              height="39"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={getShapeItemsColor()}
              x="17"
              y="65"
              width="23"
              height="39"
              rx="8"
            ></rect>
          </g>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="149"
            y="15"
            width="83"
            height="18"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="66"
            y="204"
            width="83"
            height="18"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="16"
            y="20"
            width="23"
            height="59"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="14"
            y="185"
            width="25"
            height="38"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="279"
            y="32"
            width="25"
            height="38"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={getBgItemsColor()}
            x="279"
            y="147"
            width="25"
            height="77"
            rx="8"
          ></rect>
        </g>
      </g>
    </svg>
  )
}

export const ThemePresetThumbnailContainer = styled(Box)<{
  isActive: boolean
  theme: Theme
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 95px;

  ${(p) =>
    p.isActive &&
    `
    svg { 
      outline: 5px solid ${p.theme.colors.accent['500']}; 
    }`}

  box-shadow: 0 0 10px 0 #0002;

  transition: 0.2s transform;
  &:hover {
    transform: translateY(-4px);
  }
`

export const ThemePresetThumbnails = styled(Box)`
  margin: 0 -10px;
  padding-top: 10px;

  > * {
    margin-right: 8px;
    margin-left: 8px;
    margin-bottom: 16px;
  }
`
