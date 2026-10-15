'use client'

import { createContext, useContext } from 'react'

const PlatformNameContext = createContext<string>('PortfolioHub')

export function PlatformProvider({ name, children }: { name: string; children: React.ReactNode }) {
  return <PlatformNameContext.Provider value={name}>{children}</PlatformNameContext.Provider>
}

export function usePlatformName() {
  return useContext(PlatformNameContext)
}
