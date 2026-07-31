import { useEffect, useRef, useState } from 'react'
import { TextField, type TextFieldProps } from '@mui/material'

type ClickToEditFieldProps = TextFieldProps & {
  /** When true, field stays read-only (e.g. demo mode). */
  locked?: boolean
}

export function ClickToEditField({
  locked = false,
  onBlur,
  onClick,
  slotProps,
  sx,
  ...props
}: ClickToEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const readOnly = locked || !editing

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    if (inputRef.current && 'setSelectionRange' in inputRef.current) {
      const length = inputRef.current.value.length
      try {
        inputRef.current.setSelectionRange(length, length)
      } catch {
        // Some input types (number) do not support selection ranges.
      }
    }
  }, [editing])

  return (
    <TextField
      {...props}
      inputRef={inputRef}
      onClick={(event) => {
        if (!locked) setEditing(true)
        onClick?.(event)
      }}
      onBlur={(event) => {
        setEditing(false)
        onBlur?.(event)
      }}
      slotProps={{
        ...slotProps,
        htmlInput: {
          ...(typeof slotProps?.htmlInput === 'object' ? slotProps.htmlInput : {}),
          readOnly,
        },
      }}
      sx={{
        cursor: locked ? 'default' : editing ? 'text' : 'pointer',
        '& .MuiInputBase-root': {
          cursor: locked ? 'default' : editing ? 'text' : 'pointer',
        },
        ...sx,
      }}
    />
  )
}
