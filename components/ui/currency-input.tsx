'use client'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { formatThousands, parseThousands } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string
  onValueChange: (raw: string) => void
}

export function CurrencyInput({ value, onValueChange, placeholder = '0', className, ...rest }: CurrencyInputProps) {
  const display = value ? formatThousands(value) : ''
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={e => onValueChange(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
      className={className}
      {...rest}
    />
  )
}

// hook-less helper for controlled numeric state that stores digits string
export function useCurrencyState(initial = '') {
  const [raw, setRaw] = React.useState(initial)
  const numeric = React.useMemo(() => parseThousands(raw), [raw])
  return { raw, setRaw, numeric, display: formatThousands(raw) }
}
