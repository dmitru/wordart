import {
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Stack,
  Textarea,
  Text,
  Spinner,
} from '@chakra-ui/core'
import { yupResolver } from '@hookform/resolvers'
import { observer } from 'mobx-react'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useStore } from 'services/root-store'
import * as Yup from 'yup'
import { config } from 'config'

export type ContactFormValues = {
  email: string
  name: string
  message: string
}

const contactFormSchema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .required('Please enter your email'),
  message: Yup.string().required('Please provide your message'),
})

export const ContactForm = observer(() => {
  const { authStore } = useStore()

  const [error, setError] = useState('')

  console.log(
    'authStore.profile',
    authStore.profile?.email,
    authStore.hasInitialized
  )

  const { register, handleSubmit, errors, formState, reset } = useForm<
    ContactFormValues
  >({
    defaultValues: {
      email: authStore.profile?.email || '',
    },
    resolver: yupResolver(contactFormSchema),
  })

  const onSubmit = async (values: ContactFormValues) => {
    try {
      // await authStore.loginWithEmail(values)
    } catch (error) {
      setError(
        `Sorry, there was a problem on our end. Please email our support at ${config.supportEmail}.`
      )
    }
  }

  useEffect(() => {
    if (authStore.hasInitialized) {
      reset({
        email: authStore.profile?.email || '',
      })
    }
  }, [authStore.hasInitialized])

  if (!authStore.hasInitialized) {
    return <Spinner />
  }

  return (
    <Stack
      flex="2"
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      spacing="4"
      maxWidth="500px"
    >
      <FormControl id="email">
        <FormLabel>Email address</FormLabel>
        <Input
          placeholder="How can we reach you?"
          type="email"
          name="email"
          ref={register}
        />
        {errors.email && (
          <FormHelperText color="red.500">
            {errors.email?.message}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl id="name">
        <FormLabel>Your name</FormLabel>
        <Input placeholder="Your name" name="name" ref={register} />
        {errors.name && (
          <FormHelperText color="red.500">
            {errors.name?.message}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl id="message">
        <FormLabel>Your message</FormLabel>
        <Textarea
          rows={10}
          placeholder="Describe your problem in detail, ask a question, etc"
          name="message"
          ref={register}
        />
        {errors.message && (
          <FormHelperText color="red.500">
            {errors.message?.message}
          </FormHelperText>
        )}
      </FormControl>

      <Button
        type="submit"
        colorScheme="primary"
        isLoading={formState.isSubmitting}
      >
        Send your message
      </Button>

      {error && <Text color="red.500">{error}</Text>}
    </Stack>
  )
})
