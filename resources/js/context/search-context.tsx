// resources/js/context/search-context.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SearchContextType {
  open: boolean
  setOpen: (value: boolean) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch has to be used within <SearchProvider>')
  }
  return context
}
