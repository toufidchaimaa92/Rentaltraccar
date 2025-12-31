'use client'

import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  className?: string
  placeholder?: string
}

export default function Search({ className = '', placeholder = 'Rechercher une location par ID' }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const go = () => {
    const id = value.trim()
    if (!id) return
    router.visit(route('rentals.show', { rental: id }))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
<DialogTrigger asChild>
  <Button
    variant="ghost"
    className={cn(
      // 🔵 MOBILE: round icon button
      'h-9 w-9 rounded-full p-0 sm:h-8 sm:w-auto sm:rounded-md sm:px-3',
      'bg-muted/40 hover:bg-muted text-muted-foreground',
      'flex items-center justify-center gap-2',
      className,
    )}
  >
    <SearchIcon className="h-4 w-4" />

    {/* 🖥 Desktop text only */}
    <span className="hidden sm:inline text-sm">
      {placeholder}
    </span>
  </Button>
</DialogTrigger>


      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            Trouver une location
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-4">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                go()
              }
            }}
            placeholder={placeholder}
            inputMode="numeric"
          />
          <Button onClick={go}>Aller</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
