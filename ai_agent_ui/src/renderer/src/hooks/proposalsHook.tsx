import { useState } from 'react'
import { createStore } from 'reusable'

/*
export const proposalsHook = createStore(
  (): [string | null, (onchainProposals: string) => Promise<void>] => {
    // The function now explicitly returns a tuple of type [string | null, (networkSelect: string) => Promise<void>]

    const [onchainProposals, setOnchainProposals] = useState<string | null>(
      localStorage.getItem('onchainProposals')
    )
    const handleSelectPorposals = async (onchainProposals: string): Promise<void> => {
      localStorage.setItem('onchainProposals', onchainProposals)
      setOnchainProposals(onchainProposals)
    }

    return [onchainProposals, handleSelectPorposals]
  }
)
*/createStore
export const proposalsHook = createStore(() => useState([]))