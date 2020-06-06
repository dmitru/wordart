import { Box } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { ThemePreset } from 'components/Editor/style'

export const ThemePresetThumbnail: React.FC<{ theme: ThemePreset }> = ({
  theme,
}) => {
  let shapeItemsColor = 'black'
  if (theme.shapeItemsColoring.kind === 'color') {
    shapeItemsColor = theme.shapeItemsColoring.color
  } else if (theme.shapeItemsColoring.kind === 'gradient') {
    shapeItemsColor = theme.shapeItemsColoring.gradient.from
  } else if (theme.shapeItemsColoring.kind === 'shape') {
    shapeItemsColor = theme.shapeFill
  }

  let bgItemsColor = 'black'
  if (theme.bgItemsColoring.kind === 'color') {
    bgItemsColor = theme.bgItemsColoring.color
  } else if (theme.bgItemsColoring.kind === 'gradient') {
    bgItemsColor = theme.bgItemsColoring.gradient.from
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
              opacity={theme.shapeOpacity}
              x="0"
              y="0"
              width="218"
              height="140"
              rx="29"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="16"
              y="29"
              width="112"
              height="21"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="68"
              y="67"
              width="84"
              height="17"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="56"
              y="99"
              width="72"
              height="22"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="152"
              y="33"
              width="54"
              height="17"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="168"
              y="80"
              width="23"
              height="39"
              rx="8"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="17"
              y="65"
              width="23"
              height="39"
              rx="8"
            ></rect>
          </g>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="149"
            y="15"
            width="83"
            height="18"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="66"
            y="204"
            width="83"
            height="18"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="16"
            y="20"
            width="23"
            height="59"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="14"
            y="185"
            width="25"
            height="38"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="279"
            y="32"
            width="25"
            height="38"
            rx="8"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
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

export const ThemePresetThumbnailContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;

  transition: 0.2s transform;
  &:hover {
    transform: scale(1.05);
  }
`

export const ThemePresetThumbnails = styled(Box)`
  margin: 0 -10px;

  > * {
    margin-right: 10px;
    margin-left: 10px;
    margin-bottom: 16px;
  }
`
