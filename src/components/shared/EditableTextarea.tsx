import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { noop } from 'lodash'
import {
  Box,
  BoxProps,
  Button,
  Textarea,
  Stack,
  TextareaProps,
} from '@chakra-ui/core'

export type EditableTextareaProps = {
  value: string
  onEdit?: (value: string) => void
  onSave?: (value: string) => void
  onSaveCancel?: (value: string) => void
  textareaProps?: Partial<TextareaProps>
} & Partial<BoxProps>

export const EditableTextarea: React.FC<EditableTextareaProps> = ({
  value,
  onEdit = noop,
  onSave = noop,
  onSaveCancel = noop,
  textareaProps = {},
  ...rest
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [textAreaValue, setTextAreaValue] = useState(value)

  const handleEditClick = useCallback(() => {
    setIsEditing(true)
    setTextAreaValue(value)
  }, [value])

  const handleSaveClick = useCallback(() => {
    setIsEditing(false)
    onSave(textAreaValue)
  }, [textAreaValue])

  const handleSaveCancelClick = useCallback(() => {
    setIsEditing(false)
    onSaveCancel(value)
  }, [value])

  useEffect(() => {
    setTextAreaValue(value)
  }, [value])

  const content = !isEditing ? (
    <>
      <Preview
        py="3"
        px="4"
        borderRadius="lg"
        borderColor="gray.200"
        borderStyle="solid"
        borderWidth="1px"
        cursor="pointer"
        onClick={handleEditClick}
      >
        {value}
      </Preview>
      <Box textAlign="right">
        <Button mt="3" onClick={handleEditClick}>
          Edit
        </Button>
      </Box>
    </>
  ) : (
    <>
      <Textarea
        {...textareaProps}
        value={textAreaValue}
        onChange={(e: any) => {
          const value = e.target.value as string
          setTextAreaValue(value)
          onEdit(value)
        }}
      />
      <Stack direction="row" spacing="3" mt="3" justifyContent="flex-end">
        <Button onClick={handleSaveCancelClick} variant="ghost">
          Cancel
        </Button>
        <Button onClick={handleSaveClick} colorScheme="accent">
          Save
        </Button>
      </Stack>
    </>
  )

  return <Box {...rest}>{content}</Box>
}

const Preview = styled(Box)``
