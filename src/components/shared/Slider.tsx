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
import { Box } from 'components/shared/Box'
import { css } from '@emotion/react'
import { lighten } from 'polished'

export type SliderProps = {
  value: number
  label?: string
  onChange?: (value: number) => void
  min: number
  max: number
  step: number
}

export const Slider: React.FC<SliderProps> = (props) => {
  const { min, max, step, value, label, onChange = noop } = props
  return (
    <Box
      css={css`
        //position: relative;
      `}
      mb={2}
    >
      {label && (
        <Box
          css={css`
            margin-bottom: -4px;
          `}
        >
          {label}
        </Box>
      )}
      <SliderImpl
        domain={[min, max]}
        values={[value]}
        step={step}
        onChange={(value) => onChange(value[0])}
        css={css`
          position: relative;
          height: 30px;
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
            top: 10,
            width: '100%',
            height: 14,
            borderRadius: theme.radii.default,
            pointerEvents: 'none',
            backgroundColor: theme.colors.muted,
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
}

export const Handle: React.FC<HandleProps> = ({
  domain: [min, max],
  handle: { id, value, percent },
  disabled = false,
  getHandleProps,
}) => {
  return (
    <>
      <div
        css={(theme) =>
          css({
            left: `${percent}%`,
            position: 'absolute',
            transform: 'translate(-50%, 0)',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            zIndex: 5,
            width: 28,
            height: 30,
            cursor: 'pointer',
            backgroundColor: 'none',
          })
        }
        {...getHandleProps(id)}
      />
      <div
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        css={(theme) =>
          css({
            left: `${percent}%`,
            position: 'absolute',
            transform: 'translate(-50%, 0)',
            zIndex: 2,
            width: 24,
            height: 24,
            // borderRadius: '50%',
            backgroundColor: disabled
              ? '#666'
              : lighten(0.1, theme.colors.primary),
          })
        }
      />
    </>
  )
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
        top: 4,
        whiteSpace: 'nowrap',
        color: theme.colors.textLight,
        minWidth: 36,
        width: 'auto',
        fontSize: 12,
        display: 'flex-inline',
        alignItems: 'center',
        justifyContent: 'center',
        height: 24,
        borderRadius: theme.radii.default,
        backgroundColor: disabled
          ? '#666'
          : lighten(0.05, theme.colors.primary),
      })}
      {...getHandleProps(id)}
    >
      {showValue && value.toFixed(0)}
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
        backgroundColor: disabled ? '#999' : '#607E9E',
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
