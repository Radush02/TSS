"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import RetailerFactoryABI from "../abi/RetailerFactory.json";
import PlanAbonamentABI from "../abi/PlanAbonament.json";
import { useRouter } from "next/navigation"

interface PlansListProps {
  factoryAddress: string
  provider: ethers.BrowserProvider | null
  onSelectPlan: (planAddress: string) => void
}

interface PlanInfo {
  id: number
  address: string
  retailer: string
  price: string
  duration: string
  available: string
}

export function PlansList({ factoryAddress, provider, onSelectPlan }: PlansListProps) {
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter() 
  useEffect(() => {
    const fetchPlans = async () => {
      if (!provider || !factoryAddress) return

      setLoading(true)
      setError(null)

      try {
        const factoryContract = new ethers.Contract(
          factoryAddress,
          RetailerFactoryABI.abi,
          provider,
        )



        const nextPlanId = await factoryContract.nextPlanId()
        const planPromises = []

        for (let i = 0; i < nextPlanId; i++) {
          planPromises.push(fetchPlanInfo(i, factoryContract));
        }

        const planResults = await Promise.all(planPromises)
        setPlans(planResults.filter((plan) => plan !== null))
      } catch (err) {
        console.error("Error fetching plans:", err)
        setError("Failed to fetch subscription plans. Please check the factory address.")
      } finally {
        setLoading(false)
      }
    }

    const fetchPlanInfo = async (id: number, factoryContract: ethers.Contract) => {
      try {
        const planAddress = await factoryContract.abonamente(id)
        if (planAddress === ethers.ZeroAddress) {
          return null
        }

        const planContract = new ethers.Contract(planAddress, PlanAbonamentABI.abi, provider)

        const [retailer, price, duration, available] = await Promise.all([
          planContract.retailer(),
          planContract.pretSubscriptie(),
          planContract.durata(),
          planContract.abonamenteDisp(),
        ])

        return {
          id,
          address: planAddress,
          retailer,
          price: ethers.formatEther(price),
          duration: duration.toString(),
          available: available.toString(),
        }
      } catch (error) {
        console.error(`Error fetching plan ${id}:`, error)
        return null
      }
    }

    fetchPlans()
  }, [factoryAddress, provider])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-4 pt-0">
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>
  }

  if (plans.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">No subscription plans found.</p>
        <p className="text-sm mt-2">Create a new plan using the Create Plan tab.</p>
      </div>
    )
  }

return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{plan.retailer}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span> {plan.price} ETH
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span> {plan.duration} days
                </div>
                <div>
                  <span className="text-muted-foreground">Available:</span> {plan.available}
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span> {plan.id}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end p-4 pt-0">
            <Button
              onClick={() => {
                onSelectPlan(plan.address)
                router.push(`/plans/${plan.address}`)
              }}
            >
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
