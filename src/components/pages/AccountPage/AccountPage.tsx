import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { PromptModal } from 'components/shared/PromptModal'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import Timeago from 'react-timeago'

export const AccountPage = observer(() => {
  const {
    authStore,
    authStore: { profile },
  } = useStore()

  const upgradeModal = useUpgradeModal()
  const toasts = useToasts()
  const [isShowingDeleteConfirm, setIsShowingDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!authStore.orders) {
      authStore.fetchMyOrders()
    }
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

            {profile.limits.isActiveUnlimitedPlan &&
              profile.unlimitedPlanExpiresAt && (
                <Alert status="info" mt="2">
                  <AlertIcon />
                  {'Your unlimited plan expires in '}
                  <Timeago date={profile.unlimitedPlanExpiresAt} />
                  {' at '}
                  {new Date(profile.unlimitedPlanExpiresAt!).toLocaleString()}.
                </Alert>
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
        {authStore.orders == null && <Spinner />}
        {authStore.orders && authStore.orders.length === 0 && (
          <p>You haven't made any purchases yet.</p>
        )}
        {authStore.orders && authStore.orders.length > 0 && (
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
                {authStore.orders.map((order) => (
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
            {/* <pre>{JSON.stringify(authStore.orders, null, 2)}</pre> */}
          </>
        )}

        <h1>Account Actions</h1>
        <Stack spacing="3" direction="row" alignItems="flex-start">
          <Link passHref href={Urls.resetPasswordRequest}>
            <Button colorScheme="primary" as="a">
              Change password
            </Button>
          </Link>

          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => {
              setIsShowingDeleteConfirm(true)
            }}
          >
            Delete my account
          </Button>
        </Stack>
      </Box>

      {/* Delete account modal */}
      <PromptModal
        title="Confirm account removal"
        isOpen={isShowingDeleteConfirm}
        onCancel={() => setIsShowingDeleteConfirm(false)}
        submitText="Delete my account"
        isSubmitEnabled={(value) => value.trim().toLowerCase() === 'delete'}
        onSubmit={async (value) => {
          if (value.trim().toLowerCase() === 'delete') {
            await authStore.deleteMyAccount()
            toasts.showSuccess({
              title: 'You account and all your data has been deleted',
            })
          }
        }}
      >
        <p>
          After you delete your account, all your data will be erased. You won't
          be able to restore it.
        </p>
        <p>Type in "delete" if you really want to delete your account.</p>
      </PromptModal>
    </SiteLayout>
  )
})
