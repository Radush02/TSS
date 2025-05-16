"use client"

import type React from "react"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RetailerFactoryABI from "../abi/RetailerFactory.json";

interface DeployFactoryProps {
  signer: ethers.Signer | null
  onFactoryDeployed: (address: string) => void
}

export function DeployFactory({ signer, onFactoryDeployed }: DeployFactoryProps) {
  const [factoryAddress, setFactoryAddress] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFactoryAddress(e.target.value)
    setError(null)
  }

  const handleVerifyAndUse = async () => {
    if (!signer || !factoryAddress) return

    setVerifying(true)
    setError(null)

    try {
      if (!ethers.isAddress(factoryAddress)) {
        throw new Error("Invalid Ethereum address format")
      }

      
      if (!signer.provider) {
        throw new Error("No provider found for the signer")
      }
      const code = await signer.provider.getCode(factoryAddress)
      if (code === "0x") {
        throw new Error("No contract found at this address")
      }

      const factoryContract = new ethers.Contract(
        factoryAddress,
        RetailerFactoryABI.abi,
        signer,
      )

      await factoryContract.owner()
      await factoryContract.nextPlanId()

      onFactoryDeployed(factoryAddress)
    } catch (err) {
      console.error("Error verifying contract:", err)
      setError(err instanceof Error ? err.message : "Failed to verify contract at this address")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="existing">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Use Existing Contract</TabsTrigger>
            <TabsTrigger value="deploy">Deploy Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-medium">Use Existing RetailerFactory Contract</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the address of an existing RetailerFactory contract.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factory-address">RetailerFactory Contract Address</Label>
              <Input
                id="factory-address"
                value={factoryAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="font-mono"
              />
            </div>

            <Button onClick={handleVerifyAndUse} disabled={!signer || !factoryAddress || verifying} className="w-full">
              {verifying ? "Verifying..." : "Verify & Use Contract"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="deploy" className="space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-medium">Deploy Using Remix</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Follow these steps to deploy the RetailerFactory contract using Remix IDE:
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <a
                    href="https://remix.ethereum.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center"
                  >
                    Open Remix IDE
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </li>
                <li>
                  Create a new file named <code className="bg-muted px-1 rounded">RetailerFactory.sol</code> and paste
                  the contract code
                </li>
                <li>
                  Create another file named <code className="bg-muted px-1 rounded">PlanAbonament.sol</code> and paste
                  that contract code
                </li>
                <li>
                  Create a third file named <code className="bg-muted px-1 rounded">AbonamentNFT.sol</code> for the NFT
                  contract
                </li>
                <li>Compile the contracts using the Solidity compiler (0.8.10 or compatible)</li>
                <li>Go to the "Deploy & Run Transactions" tab</li>
                <li>Select "Injected Provider - MetaMask" as the environment</li>
                <li>Select "RetailerFactory" from the contract dropdown</li>
                <li>Enter your wallet address as the constructor parameter</li>
                <li>Click "Deploy" and confirm the transaction in MetaMask</li>
                <li>Once deployed, copy the contract address and paste it in the "Use Existing Contract" tab</li>
              </ol>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                After deploying, you'll need to copy the contract address and enter it in the "Use Existing Contract"
                tab.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
