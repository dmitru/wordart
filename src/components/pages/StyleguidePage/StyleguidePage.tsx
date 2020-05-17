import React from 'react'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import styled from '@emotion/styled'
import { Checkbox } from 'components/shared/Checkbox'
import { observable } from 'mobx'
import { Box } from 'components/shared/Box'
import { Button } from '@chakra-ui/core'

const PageLayoutWrapper = styled.div`
  margin: 50px auto;
  max-width: 900px;
  border: 1px solid #444;
  padding: 20px;
`

const Section = styled(Box)`
  margin-bottom: 20px;
`

const state = observable({
  checkbox1: true,
  checkbox2: false,
})

export const StyleguidePage = observer(() => {
  return (
    <PageLayoutWrapper>
      <Section>
        <h1>Buttons</h1>
        <Button variantColor="primary">Primary</Button>
        <Button variantColor="secondary">Secondary</Button>
        <Button variantColor="primary" variant="outline">
          Primary
        </Button>
        <Button variantColor="secondary" variant="outline">
          Secondary
        </Button>
      </Section>
      {/* 
      <Section>
        <h1>Form controls</h1>
        <Box>
          <Checkbox
            id="checkbox1"
            label="I'm a checkbox"
            value={state.checkbox1}
            onChange={(checked) => {
              state.checkbox1 = checked
            }}
          />
        </Box>
        <Box>
          <Checkbox
            id="checkbox2"
            label="I'm another checkbox"
            value={state.checkbox2}
            onChange={(checked) => {
              state.checkbox2 = checked
            }}
          />
        </Box>
      </Section>

      <Section>
        <h1>Headings</h1>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
      </Section> */}
    </PageLayoutWrapper>
  )
})
