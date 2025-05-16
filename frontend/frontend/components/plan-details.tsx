"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SubscriptionsList } from "@/components/subscriptions-list"
import { DiscountCalculator } from "@/components/discount-calculator"
import PlanAbonamentABI from "../abi/PlanAbonament.json"

interface PlanDetailsProps {
  planAddress: string
  signer: ethers.Signer
  account: string | null
}

interface PlanData {
  retailer: string
  price: string
  duration: string
  available: string
  description: string
  metadataURI: string
  cancelled: boolean
  nftAddress: string
  owner: string
}

export function PlanDetails({ planAddress, signer, account }: PlanDetailsProps) {
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("0")
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<{
    type: string
    status: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!signer || !planAddress) return

      setLoading(true)
      setError(null)

      try {
        const planContract = new ethers.Contract(
          planAddress,
          PlanAbonamentABI.abi,
          signer,
        )

        const [
          retailer,
          price,
          duration,
          available,
          description,
          metadataURI,
          cancelled,
          nftAddress,
          owner,
          withdrawableAmount,
        ] = await Promise.all([
          planContract.retailer(),
          planContract.pretSubscriptie(),
          planContract.durata(),
          planContract.abonamenteDisp(),
          planContract.descriere(),
          planContract.metadataURI(),
          planContract.cancelled(),
          planContract.abonamentNFT(),
          planContract.owner(),
          planContract.retrageri(await signer.getAddress()),
        ])

        setPlanData({
          retailer,
          price: ethers.formatEther(price),
          duration: duration.toString(),
          available: available.toString(),
          description,
          metadataURI,
          cancelled,
          nftAddress,
          owner,
        })

        setIsOwner(owner.toLowerCase() === (await signer.getAddress()).toLowerCase())
        setWithdrawalAmount(ethers.formatEther(withdrawableAmount))
      } catch (err) {
        console.error("Error fetching plan details:", err)
        setError("Failed to fetch plan details. Please check the plan address.")
      } finally {
        setLoading(false)
      }
    }

    fetchPlanDetails()
  }, [planAddress, signer])

  const handlePurchaseSubscription = async () => {
    if (!signer || !planData) return

    setPurchaseLoading(true)
    setTransactionStatus(null)

    try {
      const planContract = new ethers.Contract(planAddress, PlanAbonamentABI.abi, signer)

      const tx = await planContract.cumparaSubscriptie({
        value: ethers.parseEther(planData.price),
      })

      await tx.wait()

      setTransactionStatus({
        type: "purchase",
        status: "success",
        message: "Subscription purchased successfully!",
      })

      // Refresh plan data
      const updatedAvailable = await planContract.abonamenteDisp()
      setPlanData({
        ...planData,
        available: updatedAvailable.toString(),
      })
    } catch (err) {
      console.error("Error purchasing subscription:", err)
      setTransactionStatus({
        type: "purchase",
        status: "error",
        message: "Failed to purchase subscription. Please try again.",
      })
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleCancelPlan = async () => {
    if (!signer || !isOwner) return

    setCancelLoading(true)
    setTransactionStatus(null)

    try {
      const planContract = new ethers.Contract(planAddress, PlanAbonamentABI.abi, signer)

      const tx = await planContract.cancelPlan()
      await tx.wait()

      setTransactionStatus({
        type: "cancel",
        status: "success",
        message: "Plan cancelled successfully!",
      })

      setPlanData({
        ...planData!,
        cancelled: true,
      })
    } catch (err) {
      console.error("Error cancelling plan:", err)
      setTransactionStatus({
        type: "cancel",
        status: "error",
        message: "Failed to cancel plan. Please try again.",
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!signer || Number.parseFloat(withdrawalAmount) <= 0) return

    setWithdrawLoading(true)
    setTransactionStatus(null)

    try {
      const planContract = new ethers.Contract(planAddress, PlanAbonamentABI.abi, signer)

      const tx = await planContract.withdraw()
      await tx.wait()

      setTransactionStatus({
        type: "withdraw",
        status: "success",
        message: "Funds withdrawn successfully!",
      })

      setWithdrawalAmount("0")
    } catch (err) {
      console.error("Error withdrawing funds:", err)
      setTransactionStatus({
        type: "withdraw",
        status: "error",
        message: "Failed to withdraw funds. Please try again.",
      })
    } finally {
      setWithdrawLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-24 w-full mt-4" />
        <Skeleton className="h-10 w-32 mt-4" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!planData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No data</AlertTitle>
        <AlertDescription>No plan data available.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">{planData.retailer}</h2>

          <div className="grid grid-cols-2 gap-y-4 mb-6">
            <div>
              <span className="text-muted-foreground text-sm">Price:</span>
              <p className="font-medium">{planData.price} ETH</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Duration:</span>
              <p className="font-medium">{planData.duration} days</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Available:</span>
              <p className="font-medium">{planData.available}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Status:</span>
              <p className="font-medium">
                {planData.cancelled ? (
                  <span className="text-red-500">Cancelled</span>
                ) : (
                  <span className="text-green-500">Active</span>
                )}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm">{planData.description || "No description available."}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Metadata URI</h3>
            <p className="text-sm break-all">{planData.metadataURI}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">NFT Contract</h3>
            <p className="text-sm break-all">{planData.nftAddress}</p>
          </div>
        </div>

        <div>
          <Tabs defaultValue="actions">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
              <TabsTrigger value="calculator">Discount Calculator</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-4 pt-4">
              {!planData.cancelled && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Purchase Subscription</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Purchase a subscription for {planData.price} ETH.
                    </p>
                    <Button
                      onClick={handlePurchaseSubscription}
                      disabled={purchaseLoading || planData.available === "0"}
                      className="w-full"
                    >
                      {purchaseLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Buy Subscription (${planData.price} ETH)`
                      )}
                    </Button>

                    {planData.available === "0" && (
                      <p className="text-sm text-red-500 mt-2">No subscriptions available.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwner && !planData.cancelled && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Cancel Plan</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cancel this subscription plan. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleCancelPlan}
                      disabled={cancelLoading}
                      className="w-full"
                    >
                      {cancelLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Cancel Plan"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {Number.parseFloat(withdrawalAmount) > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Withdraw Funds</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have {withdrawalAmount} ETH available to withdraw.
                    </p>
                    <Button onClick={handleWithdraw} disabled={withdrawLoading} className="w-full">
                      {withdrawLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Withdraw ${withdrawalAmount} ETH`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {transactionStatus && (
                <Alert variant={transactionStatus.status === "success" ? "default" : "destructive"}>
                  {transactionStatus.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{transactionStatus.status === "success" ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{transactionStatus.message}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="subscriptions" className="pt-4">
              {planData.nftAddress && account ? (
                <SubscriptionsList
                  nftAddress={planData.nftAddress}
                  planAddress={planAddress}
                  signer={signer}
                  account={account}
                  planCancelled={planData.cancelled}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No data</AlertTitle>
                  <AlertDescription>Unable to load subscription data.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="calculator" className="pt-4">
              <DiscountCalculator planAddress={planAddress} signer={signer} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
