"use client"

import { Button } from "@/components/ui/button"

import type React from "react"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ConnectWallet } from "@/components/connect-wallet"
import { CreatePlanForm } from "@/components/create-plan-form"
import { PlansList } from "@/components/plans-list"
import { PlanDetails } from "@/components/plan-details"
import { DeployFactory } from "@/components/deploy-factory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import RetailerFactoryABI from "../abi/RetailerFactory.json";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [factoryAddress, setFactoryAddress] = useState<string>("")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // Try to load saved factory address from localStorage
    const savedFactoryAddress = localStorage.getItem("factoryAddress")
    if (savedFactoryAddress) {
      setFactoryAddress(savedFactoryAddress)
    }
  }, [])

  useEffect(() => {
    const checkOwnership = async () => {
      if (!signer || !factoryAddress) return

      try {
        const factoryContract = new ethers.Contract(factoryAddress, RetailerFactoryABI.abi, signer)

        const owner = await factoryContract.owner()
        setIsOwner(owner.toLowerCase() === account?.toLowerCase())
      } catch (error) {
        console.error("Error checking ownership:", error)
        setIsOwner(false)
      }
    }

    checkOwnership()
  }, [signer, factoryAddress, account])

  const handleConnect = async (
    connectedAccount: string,
    connectedProvider: ethers.BrowserProvider,
    connectedSigner: ethers.Signer,
  ) => {
    setAccount(connectedAccount)
    setProvider(connectedProvider)
    setSigner(connectedSigner)
  }

  const handleFactoryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setFactoryAddress(address)
    localStorage.setItem("factoryAddress", address)
  }

  const handleFactoryDeployed = (address: string) => {
    setFactoryAddress(address)
    localStorage.setItem("factoryAddress", address)
  }

  const handlePlanSelect = (planAddress: string) => {
    setSelectedPlan(planAddress)
  }

  const handleClearFactory = () => {
    setFactoryAddress("")
    localStorage.removeItem("factoryAddress")
    setSelectedPlan(null)
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Subscription Plan Management</h1>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your Ethereum wallet to interact with the contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectWallet onConnect={handleConnect} account={account} />

            {account && (
              <div className="mt-6">
                {factoryAddress ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="factory-address" className="block text-sm font-medium mb-2">
                        RetailerFactory Contract Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="factory-address"
                          type="text"
                          value={factoryAddress}
                          onChange={handleFactoryAddressChange}
                          placeholder="0x..."
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        />
                        <Button variant="outline" onClick={handleClearFactory}>
                          Change
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isOwner ? "You are the owner of this contract." : "You are not the owner of this contract."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <DeployFactory signer={signer} onFactoryDeployed={handleFactoryDeployed} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!account && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to use this application.</AlertDescription>
        </Alert>
      )}

      {account && !factoryAddress && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Factory not set</AlertTitle>
          <AlertDescription>
            Please enter an existing RetailerFactory contract address or deploy a new one using Remix.
          </AlertDescription>
        </Alert>
      )}

      {account && factoryAddress && (
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">View Plans</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedPlan}>
              Plan Details
            </TabsTrigger>
            <TabsTrigger value="create" disabled={!isOwner}>
              Create Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Available Subscription Plans</CardTitle>
                <CardDescription>View and select a subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <PlansList factoryAddress={factoryAddress} provider={provider} onSelectPlan={handlePlanSelect} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
                <CardDescription>View and interact with the selected plan</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPlan && signer ? (
                  <PlanDetails planAddress={selectedPlan} signer={signer} account={account} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No plan selected</AlertTitle>
                    <AlertDescription>Please select a plan from the plans list.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Subscription Plan</CardTitle>
                <CardDescription>Create a new subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                {isOwner && factoryAddress && signer ? (
                  <CreatePlanForm factoryAddress={factoryAddress} signer={signer} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not authorized</AlertTitle>
                    <AlertDescription>You must be the owner of the factory contract to create plans.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
