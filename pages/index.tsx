import React, { useEffect, useRef, useState } from 'react'
import { Layout } from 'components/layout'
import { scratch, WordArtRenderData } from 'lib/wordart/scratch'
import styled from 'styled-components'

const HomePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      scratch(canvasRef.current)
    }
  }, [canvasRef.current])

  return (
    <Layout>
      <h1>Hello world!</h1>
      <Canvas width={600} height={400} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default HomePage
