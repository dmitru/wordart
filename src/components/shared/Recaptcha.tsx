/**
 * Adapted from https://github.com/sarneeh/reaptcha
 *
 * Does not try to reset the recaptcha when the component unmounts, since that
 * causes errors.
 */

import React, { Component, ReactNode } from 'react'
import { isAnyScriptPresent, injectScript } from 'utils/scripts'

declare var window: {
  grecaptcha: {
    ready: (callback: Function) => Promise<void>
    render: (container: HTMLElement, config: RecaptchaConfig) => number
    execute: (id?: number) => void
    reset: (id?: number) => void
  }
}

type Props = {
  id?: string
  className?: string
  sitekey: string
  theme?: 'light' | 'dark'
  size?: 'compact' | 'normal' | 'invisible'
  badge?: 'bottomright' | 'bottomleft' | 'inline'
  tabindex?: number
  explicit?: boolean
  onLoad?: () => void
  onRender?: () => void
  onVerify: (response: string) => void
  onExpire?: () => void
  onError?: () => void
  inject?: boolean
  isolated?: boolean
  hl?: string
  children?: (renderProps: RenderProps) => Node
}

export class Recaptcha extends Component<Props, State> {
  container?: HTMLDivElement = undefined

  constructor(props: Props) {
    super(props)

    this.state = {
      ready: false,
      rendered: false,
      invisible: this.props.size === 'invisible',
    }
  }

  static defaultProps = {
    id: '',
    className: 'g-recaptcha',
    theme: 'light',
    size: 'normal',
    badge: 'bottomright',
    tabindex: 0,
    explicit: false,
    inject: true,
    isolated: false,
    hl: '',
  }

  _isAvailable = (): boolean =>
    Boolean(window && window.grecaptcha && window.grecaptcha.ready)

  _inject = (): void => {
    if (this.props.inject && !isAnyScriptPresent(RECAPTCHA_SCRIPT_REGEX)) {
      const hlParam = this.props.hl ? `&hl=${this.props.hl}` : ''
      const src = `${RECAPTCHA_SCRIPT_URL}?render=explicit${hlParam}`
      injectScript(src)
    }
  }

  _prepare = (): void => {
    const { explicit, onLoad } = this.props
    window.grecaptcha.ready(() => {
      this.setState({ ready: true }, () => {
        if (!explicit) {
          this.renderExplicitly()
        }
        if (onLoad) {
          onLoad()
        }
      })
    })
  }

  _renderRecaptcha = (
    container: HTMLDivElement,
    config: RecaptchaConfig
  ): number => window.grecaptcha.render(container, config)

  _resetRecaptcha = (): void => window.grecaptcha.reset(this.state.instanceId)

  _executeRecaptcha = (): void =>
    window.grecaptcha.execute(this.state.instanceId)

  _stopTimer = (): void => {
    if (this.state.timer) {
      clearInterval(this.state.timer)
    }
  }

  componentDidMount = (): void => {
    this._inject()

    if (this._isAvailable()) {
      this._prepare()
    } else {
      const timer = setInterval(() => {
        if (this._isAvailable()) {
          this._prepare()
          this._stopTimer()
        }
      }, 500)
      this.setState({ timer })
    }
  }

  shouldComponentUpdate = (): boolean => !this.state.rendered

  componentWillUnmount = (): void => {
    this._stopTimer()
  }

  renderExplicitly = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.state.rendered) {
        return reject(
          new Error('This recaptcha instance has been already rendered.')
        )
      }
      if (this.state.ready && this.container) {
        const instanceId = this._renderRecaptcha(this.container, {
          sitekey: this.props.sitekey,
          theme: this.props.theme,
          size: this.props.size,
          badge: this.state.invisible ? this.props.badge : undefined,
          tabindex: this.props.tabindex,
          callback: this.props.onVerify,
          'expired-callback': this.props.onExpire,
          'error-callback': this.props.onError,
          isolated: this.state.invisible ? this.props.isolated : undefined,
          hl: this.state.invisible ? undefined : this.props.hl,
        })

        this.setState(
          {
            instanceId,
            rendered: true,
          },
          () => {
            if (this.props.onRender) {
              this.props.onRender()
            }
            resolve()
          }
        )
      } else {
        return reject(new Error('Recaptcha is not ready for rendering yet.'))
      }
    })
  }

  reset = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (this.state.rendered) {
        this._resetRecaptcha()
        return resolve()
      }
      reject(new Error('This recaptcha instance did not render yet.'))
    })
  }

  execute = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!this.state.invisible) {
        return reject(
          new Error('Manual execution is only available for invisible size.')
        )
      }
      if (this.state.rendered) {
        this._executeRecaptcha()
        resolve()
      }
      return reject(new Error('This recaptcha instance did not render yet.'))
    })
  }

  render = () => {
    const container = (
      <div
        id={this.props.id}
        className={this.props.className}
        ref={(e) => {
          return (this.container = e || undefined)
        }}
      />
    )

    return this.props.children
      ? this.props.children({
          renderExplicitly: this.renderExplicitly,
          reset: this.reset,
          execute: this.execute,
          recaptchaComponent: container,
        })
      : container
  }
}

type RecaptchaConfig = {
  sitekey: string
  theme?: string
  size?: string
  badge?: string
  tabindex?: number
  callback?: Function
  'expired-callback'?: Function
  'error-callback'?: Function
  isolated?: boolean
  hl?: string
}

type RenderProps = {
  renderExplicitly: () => Promise<void>
  reset: () => Promise<void>
  execute: () => Promise<void>
  recaptchaComponent: ReactNode
}

type State = {
  instanceId?: number
  ready: boolean
  rendered: boolean
  invisible: boolean
  timer?: NodeJS.Timeout
}

const RECAPTCHA_SCRIPT_URL = 'https://recaptcha.net/recaptcha/api.js'
const RECAPTCHA_SCRIPT_REGEX = /(http|https):\/\/(www)?.+\/recaptcha/
