import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import { scratch } from 'lib/wordart/scratch'
import styled from 'styled-components'

const HomePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      return scratch(canvasRef.current)
    }
  }, [canvasRef.current])

  return (
    <Layout>
      <Canvas width={800} height={800} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default HomePage
