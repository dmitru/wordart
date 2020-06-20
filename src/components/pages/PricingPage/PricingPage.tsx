import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { Box, Button } from '@chakra-ui/core'

export const PricingPage = observer(() => {
  const { authStore } = useStore()
  const { profile } = authStore

  const plans = authStore.getPlans()

  return (
    <SiteLayout>
      <Box>
        <h1>Pricing</h1>

        {plans.map((plan) => (
          <div key={plan.id}>
            PLAN {plan.title}
            {plan.price && `${plan.price.price.net} ${plan.price.currency}`}
            <Button
              onClick={() => {
                ;(window as any)['Paddle'].Checkout.open({
                  product: plan.id,
                  email: profile?.email,
                })
              }}
            >
              Buy
            </Button>
          </div>
        ))}
      </Box>
    </SiteLayout>
  )
})
