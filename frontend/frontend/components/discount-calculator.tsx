"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import PlanAbonamentABI from "../abi/PlanAbonament.json"
interface DiscountCalculatorProps {
  planAddress: string
  signer: ethers.Signer
}

export function DiscountCalculator({ planAddress, signer }: DiscountCalculatorProps) {
  const [amount, setAmount] = useState<string>("1")
  const [quantity, setQuantity] = useState<string>("1")
  const [discountedAmount, setDiscountedAmount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculateDiscount = async () => {
    if (!signer || !planAddress) return

    setLoading(true)
    setError(null)
    setDiscountedAmount(null)

    try {
      const planContract = new ethers.Contract(
        planAddress,
        PlanAbonamentABI.abi,
        signer,
      )

      const amountInWei = ethers.parseEther(amount)
      const result = await planContract.calculeazaDiscount(amountInWei, Number.parseInt(quantity))

      setDiscountedAmount(ethers.formatEther(result))
    } catch (err) {
      console.error("Error calculating discount:", err)
      setError("Failed to calculate discount. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Discount Calculator</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Calculate the discounted price based on amount and quantity.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="1"
              />
            </div>
          </div>

          <Button onClick={handleCalculateDiscount} disabled={loading || !amount || !quantity} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Calculate Discount"
            )}
          </Button>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          {discountedAmount !== null && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Results:</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Original Total:</span>
                </div>
                <div>{Number.parseFloat(amount) * Number.parseInt(quantity)} ETH</div>
                <div>
                  <span className="text-muted-foreground">Discounted Total:</span>
                </div>
                <div className="font-medium">{discountedAmount} ETH</div>
                <div>
                  <span className="text-muted-foreground">You Save:</span>
                </div>
                <div className="text-green-600 font-medium">
                  {(
                    Number.parseFloat(amount) * Number.parseInt(quantity) -
                    Number.parseFloat(discountedAmount)
                  ).toFixed(6)}{" "}
                  ETH
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
