'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{ months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0', month: 'space-y-4', ...(classNames as any) } as any}
      {...(props as any)}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
