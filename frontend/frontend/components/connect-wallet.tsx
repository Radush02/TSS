"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"

interface ConnectWalletProps {
  onConnect: (account: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => void
  account: string | null
}

export function ConnectWallet({ onConnect, account }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to use this application.")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your MetaMask wallet.")
      }

      const signer = await provider.getSigner()
      onConnect(accounts[0], provider, signer)
    } catch (err) {
      console.error("Error connecting wallet:", err)
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="flex flex-col gap-4">
      {!account ? (
        <Button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Connected Account</span>
            <span className="font-medium">{formatAddress(account)}</span>
          </div>
          <a
            href={`https://etherscan.io/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary flex items-center"
          >
            View on Etherscan
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      )}

      {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>}
    </div>
  )
}
