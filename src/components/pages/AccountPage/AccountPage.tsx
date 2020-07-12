import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { Box, Stack, Button, Spinner } from '@chakra-ui/core'
import { Order } from 'services/api/types'
import { Api } from 'services/api/api'
import { Urls } from 'urls'
import Link from 'next/link'
import { useRouter } from 'next/dist/client/router'

export const AccountPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
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
        <h1>Your account</h1>
        <Box>
          <pre>{JSON.stringify(authStore.profile, null, 2)}</pre>
          <Button
            variant="outline"
            onClick={() => {
              authStore.logout()
              router.replace(Urls.login)
            }}
          >
            Log out
          </Button>
        </Box>

        <h1>Your orders</h1>
        {state.orders == null && <Spinner />}
        {state.orders && state.orders.length === 0 && (
          <>
            <p>You haven't made any purchases yet.</p>
            <Link passHref href={Urls.pricing}>
              <Button as="a" colorScheme="primary">
                Upgrade now
              </Button>
            </Link>
          </>
        )}
        {state.orders && state.orders.length > 0 && (
          <pre>{JSON.stringify(state.orders, null, 2)}</pre>
        )}

        <h1>Account actions</h1>
        <Stack spacing="3" direction="column" alignItems="flex-start">
          <Button
            colorScheme="red"
            onClick={() => {
              authStore.logout()
            }}
          >
            Delete my account
          </Button>
        </Stack>
      </Box>
    </SiteLayout>
  )
})
