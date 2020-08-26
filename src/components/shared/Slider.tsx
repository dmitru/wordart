import * as React from 'react'
import {
  GetRailProps,
  GetHandleProps,
  GetTrackProps,
  SliderItem,
  Slider as SliderImpl,
  Rail,
  Handles,
  Tracks,
} from 'react-compound-slider'
import { noop } from 'lodash'
import { Tooltip } from 'components/shared/Tooltip'
import { css } from '@emotion/core'
import { lighten } from 'polished'
import { Text, Box, IconButton } from '@chakra-ui/core'
import { FiRefreshCw } from 'react-icons/fi'

export type SliderProps = {
  value: number
  label?: React.ReactNode
  labelRight?: string
  onChange?: (value: number) => void
  onAfterChange?: (value: number) => void
  resetValue?: number | undefined
  min: number
  max: number
  step: number
  horizontal?: boolean
  labelCss?: string
  afterLabel?: string
}

export const Slider: React.FC<SliderProps> = (props) => {
  const {
    min,
    max,
    step,
    value,
    label,
    labelRight,
    resetValue = undefined,
    horizontal = false,
    onChange = noop,
    onAfterChange = noop,
    labelCss = '',
    afterLabel = '',
    ...rest
  } = props
  return (
    <Box
      {...rest}
      mb="2"
      {...(horizontal
        ? { display: 'flex', flexDir: 'row', alignItems: 'center' }
        : {})}
    >
      {label && (
        <Text
          display="flex"
          alignItems="center"
          color="gray.500"
          fontWeight="medium"
          my="0"
          css={css`
            ${horizontal
              ? `
              margin-right: 16px;
            `
              : 'margin-bottom: 0.25rem;'}
            ${labelCss}
          `}
        >
          {label}
        </Text>
      )}

      <Box display="flex" alignItems="center" flex="1" width="100%">
        <SliderImpl
          domain={[min, max]}
          values={[value]}
          step={step}
          onUpdate={(value) => onChange(value[0])}
          onSlideEnd={(value) => onAfterChange(value[0])}
          css={css`
            position: relative;
            height: 30px;
            flex: 1;
          `}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <Box
                css={css`
                  width: calc(100% - 36px);
                  left: 18px;
                  position: relative;
                `}
              >
                {handles.map((handle) => (
                  <KeyboardHandle
                    key={handle.id}
                    handle={handle}
                    domain={[min, max]}
                    getHandleProps={getHandleProps}
                    afterLabel={afterLabel}
                  />
                ))}
              </Box>
            )}
          </Handles>
          <Tracks left={false} right={false}>
            {({ tracks, getTrackProps }) => (
              <Box>
                {tracks.map(({ id, source, target }) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                  />
                ))}
              </Box>
            )}
          </Tracks>
        </SliderImpl>

        {/* TODO: focus on the slider handle */}
        {resetValue != null && (
          <Tooltip label="Reset default" isDisabled={value === resetValue}>
            <IconButton
              aria-label="Reset default"
              icon={<FiRefreshCw />}
              variant="ghost"
              size="sm"
              color="gray.400"
              ml="2"
              isDisabled={value === resetValue}
              onClick={() => {
                onChange(resetValue)
                onAfterChange(resetValue)
              }}
            />
          </Tooltip>
        )}
      </Box>

      {labelRight && (
        <Text
          css={css`
            margin-bottom: -4px;
            ${horizontal
              ? `
              margin-right: 16px;
            `
              : ''}
            ${labelCss}
          `}
        >
          {labelRight}
        </Text>
      )}
    </Box>
  )
}

// *******************************************************
// RAIL
// *******************************************************

interface SliderRailProps {
  getRailProps: GetRailProps
}

export const SliderRail: React.FC<SliderRailProps> = ({ getRailProps }) => {
  return (
    <>
      <div
        css={(theme) =>
          css({
            position: 'absolute',
            width: '100%',
            height: 30,
            borderRadius: theme.radii.default,
            cursor: 'pointer',
          })
        }
        {...getRailProps()}
      />
      <div
        css={(theme) =>
          css({
            position: 'absolute',
            top: 15,
            width: '100%',
            height: 4,
            borderRadius: '4px',
            pointerEvents: 'none',
            backgroundColor: '#ddd',
          })
        }
      />
    </>
  )
}

// *******************************************************
// HANDLE COMPONENT
// *******************************************************
interface HandleProps {
  domain: number[]
  handle: SliderItem
  getHandleProps: GetHandleProps
  disabled?: boolean
  showValue?: boolean
  afterLabel?: string
}

// *******************************************************
// KEYBOARD HANDLE COMPONENT
// Uses a button to allow keyboard events
// *******************************************************
export const KeyboardHandle: React.FC<HandleProps> = ({
  domain: [min, max],
  handle: { id, value, percent },
  disabled = false,
  showValue = true,
  getHandleProps,
  afterLabel = '',
}) => {
  return (
    <button
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      css={(theme) => ({
        left: `${percent}%`,
        position: 'absolute',
        outline: 'none',
        cursor: 'pointer',
        transform: 'translate(-50%, 0)',
        zIndex: 2,
        top: 2,
        whiteSpace: 'nowrap',
        minWidth: 44,
        width: 'auto',
        fontSize: 12,
        display: 'flex-inline',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
        borderRadius: 8,
        color: '#555',
        fontWeight: 600,
        border: '1px solid #cfcfcf',
        boxShadow: '0 0 6px 0 #0002',
        backgroundColor: disabled ? '#666' : '#fff',
        transition: 'border 0.1s',
        '&:hover, &:focus': {
          border: `3px solid ${lighten(0.15, theme.colors.primary['500'])}`,
        },
      })}
      {...getHandleProps(id)}
    >
      {showValue && value.toFixed(0)}
      {afterLabel}
    </button>
  )
}

// *******************************************************
// TRACK COMPONENT
// *******************************************************
interface TrackProps {
  source: SliderItem
  target: SliderItem
  getTrackProps: GetTrackProps
  disabled?: boolean
}

export const Track: React.FC<TrackProps> = ({
  source,
  target,
  getTrackProps,
  disabled = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(0%, -50%)',
        height: 14,
        zIndex: 1,
        backgroundColor: disabled ? '#999' : '#888',
        borderRadius: 7,
        cursor: 'pointer',
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()}
    />
  )
}

// *******************************************************
// TICK COMPONENT
// *******************************************************
interface TickProps {
  tick: SliderItem
  count: number
  format?: (val: number) => string
}

export const Tick: React.FC<TickProps> = ({
  tick,
  count,
  format = (d) => d,
}) => {
  return (
    <div>
      <div
        style={{
          position: 'absolute',
          marginTop: 14,
          width: 1,
          height: 5,
          backgroundColor: 'rgb(200,200,200)',
          left: `${tick.percent}%`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          marginTop: 22,
          fontSize: 10,
          textAlign: 'center',
          marginLeft: `${-(100 / count) / 2}%`,
          width: `${100 / count}%`,
          left: `${tick.percent}%`,
        }}
      >
        {format(tick.value)}
      </div>
    </div>
  )
}
