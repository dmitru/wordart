import { Box, Button, Spinner, Stack, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { observer, useLocalStore } from 'mobx-react'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { FaStar } from 'react-icons/fa'
import { Api } from 'services/api/api'
import { Order } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'

export const AccountPage = observer(() => {
  const {
    authStore,
    authStore: { profile },
  } = useStore()

  const upgradeModal = useUpgradeModal()

  const state = useLocalStore<{ orders: null | Order[] }>(() => ({
    orders: null,
  }))

  useEffect(() => {
    const fetchOrders = async () => {
      state.orders = await Api.orders.fetchMy()
    }
    fetchOrders()
  }, [])

  if (!profile) {
    return null
  }

  const upgradeButton = (
    <Button
      colorScheme="accent"
      mt="3"
      onClick={() => upgradeModal.show('generic')}
    >
      <FaStar
        css={css`
          margin-right: 5px;
        `}
      />{' '}
      Upgrade to Unlimited
    </Button>
  )

  return (
    <SiteLayout>
      <Box>
        <h1>Your Account</h1>
        <Box mb="2rem">
          <Text>
            <strong>Account type: </strong>
            <span>
              {profile.limits.isActiveUnlimitedPlan ? 'UNLIMITED' : 'FREE'}
            </span>

            {profile.limits.isActiveUnlimitedPlan && (
              <Box>
                Unlimited plan expires at{' '}
                {new Date(profile.unlimitedPlanExpiresAt!).toLocaleString()}
              </Box>
            )}

            {!profile.limits.isActiveUnlimitedPlan && (
              <Box>
                {upgradeButton}

                <Text mt="4">
                  <Link passHref href={Urls.pricing}>
                    <a>Learn more about Unlimited plans</a>
                  </Link>
                </Text>
              </Box>
            )}
          </Text>
        </Box>

        <Box>
          <Text>
            <strong>Email:</strong> {profile.email}
          </Text>
          <Text>
            <strong>Account created at: </strong>
            {new Date(profile.createdAt).toLocaleString()}
          </Text>
          {/* <pre>{JSON.stringify(authStore.profile, null, 2)}</pre> */}
        </Box>

        <h1>Your Purchases</h1>
        {state.orders == null && <Spinner />}
        {state.orders && state.orders.length === 0 && (
          <>
            <p>You haven't made any purchases yet.</p>
            {upgradeButton}
          </>
        )}
        {state.orders && state.orders.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Date</th>

                  <th>Amount</th>

                  <th>Status</th>

                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      {order.amount} {order.currency}
                    </td>
                    <td>{order.status}</td>
                    <td>
                      <a href={order.receiptUrl} target="_blank">
                        Open receipt
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* <pre>{JSON.stringify(state.orders, null, 2)}</pre> */}
          </>
        )}

        <h1>Account Actions</h1>
        <Stack spacing="3" direction="row" alignItems="flex-start">
          <Button
            colorScheme="primary"
            onClick={() => {
              window.alert('TODO')
            }}
          >
            Change password
          </Button>

          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => {
              window.alert('TODO')
            }}
          >
            Delete my account
          </Button>
        </Stack>
      </Box>
    </SiteLayout>
  )
})
