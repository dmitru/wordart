import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import { scratch } from 'lib/wordart/scratches/scratch'
import styled from 'styled-components'

const HomePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && canvasRef2.current) {
      return scratch(canvasRef.current, canvasRef2.current)
    }
  }, [canvasRef.current, canvasRef2.current])

  return (
    <Layout>
      <Canvas width={1200} height={1200} ref={canvasRef} id="scene" />
      <Canvas width={1200} height={1200} ref={canvasRef2} id="scene2" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default HomePage
