import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { Box, Button, Spinner } from '@chakra-ui/core'
import { Order } from 'services/api/types'
import { Api } from 'services/api/api'

export const AccountPage = observer(() => {
  const { authStore } = useStore()
  const state = useLocalStore<{ orders: null | Order[] }>(() => ({
    orders: null,
  }))
  useEffect(() => {
    const fetchOrders = async () => {
      state.orders = await Api.orders.fetchMy()
    }
    fetchOrders()
  }, [])

  return (
    <SiteLayout>
      <Box>
        <h1>Your Account</h1>
        <pre>{JSON.stringify(authStore.profile, null, 2)}</pre>

        <h1>Your Orders</h1>
        {state.orders == null && <Spinner />}
        {state.orders && state.orders.length === 0 && (
          <>
            <p>You haven't made any purchases yet.</p>
            <Button colorScheme="accent">Upgrade now</Button>
          </>
        )}
        {state.orders && state.orders.length > 0 && (
          <pre>{JSON.stringify(state.orders, null, 2)}</pre>
        )}

        <Button
          onClick={() => {
            authStore.logout()
          }}
        >
          Log out
        </Button>
      </Box>
    </SiteLayout>
  )
})
