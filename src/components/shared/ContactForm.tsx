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
import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useStore } from 'services/root-store'
import * as Yup from 'yup'
import { config } from 'config'
import { Recaptcha } from 'components/shared/recaptcha'
import { Api } from 'services/api/api'
import { GenericEmailSupportErrorMessage } from 'constants/messages'

export type ContactFormValues = {
  email: string
  name: string
  subject: string
  message: string
}

const contactFormSchema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .required('Please enter your email'),
  message: Yup.string().required('Please provide your message'),
})

export type ContactFormProps = {
  onSubmit?: () => void
}

export const ContactForm = observer((props: ContactFormProps) => {
  const recaptchaRef = useRef<Recaptcha>(null)

  const { authStore } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    getValues,
    handleSubmit,
    errors,
    formState,
    reset,
  } = useForm<ContactFormValues>({
    defaultValues: {
      email: authStore.profile?.email || '',
    },
    resolver: yupResolver(contactFormSchema),
  })

  const onCaptchaResponse = async (token: string) => {
    recaptchaRef.current?.reset()

    try {
      await Api.feedback.sendForm({ ...getValues(), recaptcha: token })
      if (props.onSubmit) {
        props.onSubmit()
      }
    } catch (error) {
      setError(GenericEmailSupportErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true)
    recaptchaRef.current?.execute()
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
      <Recaptcha
        sitekey={config.recaptcha.siteKey}
        size="invisible"
        ref={recaptchaRef}
        onVerify={onCaptchaResponse}
      />

      <FormControl id="email">
        <FormLabel>Your email address</FormLabel>
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

      <FormControl id="subject">
        <FormLabel>Subject</FormLabel>
        <Input
          placeholder="Summary of what your message is about"
          name="subject"
          ref={register}
        />
        {errors.subject && (
          <FormHelperText color="red.500">
            {errors.subject?.message}
          </FormHelperText>
        )}
      </FormControl>

      <FormControl id="message">
        <FormLabel>Your message</FormLabel>
        <Textarea
          rows={10}
          placeholder="Ask a question, describe your problem in detail, etc"
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
        isLoading={formState.isSubmitting || isSubmitting}
      >
        Send your message
      </Button>

      {error && <Text color="red.500">{error}</Text>}
    </Stack>
  )
})
