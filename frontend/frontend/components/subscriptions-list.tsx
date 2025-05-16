"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AbonamentNFTABI from "../abi/AbonamentNFT.json"
import PlanAbonamentABI from "../abi/PlanAbonament.json"

interface SubscriptionsListProps {
  nftAddress: string
  planAddress: string
  signer: ethers.Signer
  account: string
  planCancelled: boolean
}

interface Subscription {
  id: string
  tokenURI: string
}

export function SubscriptionsList({ nftAddress, planAddress, signer, account, planCancelled }: SubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>({})
  const [transactionStatus, setTransactionStatus] = useState<{
    id: string
    status: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!signer || !nftAddress || !account) return

      setLoading(true)
      setError(null)

      try {
        const nftContract = new ethers.Contract(
          nftAddress,
          AbonamentNFTABI.abi,
          signer,
        )

        const balance = await nftContract.balanceOf(account)

        if (balance.toString() === "0") {
          setSubscriptions([])
          setLoading(false)
          return
        }

        const subscriptionPromises = []

        for (let i = 0; i < balance; i++) {
          subscriptionPromises.push(fetchSubscriptionInfo(i, nftContract, account))
        }

        const subscriptionResults = await Promise.all(subscriptionPromises)
        setSubscriptions(subscriptionResults.filter((sub) => sub !== null))
      } catch (err) {
        console.error("Error fetching subscriptions:", err)
        setError("Failed to fetch your subscriptions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    const fetchSubscriptionInfo = async (
      index: number,
      nftContract: ethers.Contract,
      owner: string,
    ): Promise<Subscription | null> => {
      try {
        const tokenId = await nftContract.tokenOfOwnerByIndex(owner, index)
        const tokenURI = await nftContract.tokenURI(tokenId)

        return {
          id: tokenId.toString(),
          tokenURI,
        }
      } catch (error) {
        console.error(`Error fetching subscription at index ${index}:`, error)
        return null
      }
    }

    fetchSubscriptions()
  }, [nftAddress, signer, account])

  const handleRefundSubscription = async (subscriptionId: string) => {
    if (!signer || !planAddress) return

    setRefundLoading((prev) => ({ ...prev, [subscriptionId]: true }))
    setTransactionStatus(null)

    try {
      const planContract = new ethers.Contract(planAddress, PlanAbonamentABI.abi, signer)

      const tx = await planContract.refundSubscriptie(subscriptionId)
      await tx.wait()

      setTransactionStatus({
        id: subscriptionId,
        status: "success",
        message: `Subscription #${subscriptionId} refunded successfully!`,
      })

      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId))
    } catch (err) {
      console.error(`Error refunding subscription #${subscriptionId}:`, err)
      setTransactionStatus({
        id: subscriptionId,
        status: "error",
        message: "Failed to refund subscription. Please try again.",
      })
    } finally {
      setRefundLoading((prev) => ({ ...prev, [subscriptionId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
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

  if (subscriptions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No subscriptions</AlertTitle>
        <AlertDescription>You don't have any subscriptions for this plan.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">Subscription #{subscription.id}</h3>
                <p className="text-sm text-muted-foreground mt-1 break-all">Token URI: {subscription.tokenURI}</p>
              </div>

              {planCancelled && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRefundSubscription(subscription.id)}
                  disabled={refundLoading[subscription.id]}
                >
                  {refundLoading[subscription.id] ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Request Refund"
                  )}
                </Button>
              )}
            </div>

            {transactionStatus && transactionStatus.id === subscription.id && (
              <Alert variant={transactionStatus.status === "success" ? "default" : "destructive"} className="mt-2">
                {transactionStatus.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{transactionStatus.status === "success" ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{transactionStatus.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
