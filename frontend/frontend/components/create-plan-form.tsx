"use client"

import type React from "react"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import RetailerFactoryABI from "../abi/RetailerFactory.json";

interface CreatePlanFormProps {
  factoryAddress: string
  signer: ethers.Signer
}

export function CreatePlanForm({ factoryAddress, signer }: CreatePlanFormProps) {
  const [formData, setFormData] = useState({
    retailer: "",
    price: "",
    duration: "30",
    available: "100",
    description: "",
    metadataURI: "",
  })

  const [loading, setLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<{
    status: "success" | "error"
    message: string
  } | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signer || !factoryAddress) return

    setLoading(true)
    setTransactionStatus(null)

    try {
      const factoryContract = new ethers.Contract(
        factoryAddress,
        RetailerFactoryABI.abi,
        signer,
      )

      const tx = await factoryContract.createSubscriptionPlan(
        formData.retailer,
        ethers.parseEther(formData.price),
        Number.parseInt(formData.duration),
        Number.parseInt(formData.available),
        formData.description,
        formData.metadataURI,
      )

      await tx.wait()

      setTransactionStatus({
        status: "success",
        message: "Subscription plan created successfully!",
      })

      // Reset form
      setFormData({
        retailer: "",
        price: "",
        duration: "30",
        available: "100",
        description: "",
        metadataURI: "",
      })
    } catch (err) {
      console.error("Error creating subscription plan:", err)
      setTransactionStatus({
        status: "error",
        message: "Failed to create subscription plan. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.retailer.trim() !== "" &&
      formData.price.trim() !== "" &&
      !isNaN(Number.parseFloat(formData.price)) &&
      Number.parseFloat(formData.price) > 0 &&
      !isNaN(Number.parseInt(formData.duration)) &&
      Number.parseInt(formData.duration) > 0 &&
      !isNaN(Number.parseInt(formData.available)) &&
      Number.parseInt(formData.available) > 0 &&
      formData.metadataURI.trim() !== ""
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="retailer">Retailer Name</Label>
            <Input
              id="retailer"
              name="retailer"
              value={formData.retailer}
              onChange={handleInputChange}
              placeholder="Enter retailer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (ETH)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.01"
              step="0.001"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="30"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available">Available Subscriptions</Label>
            <Input
              id="available"
              name="available"
              type="number"
              value={formData.available}
              onChange={handleInputChange}
              placeholder="100"
              min="1"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter subscription plan description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metadataURI">Metadata URI</Label>
          <Input
            id="metadataURI"
            name="metadataURI"
            value={formData.metadataURI}
            onChange={handleInputChange}
            placeholder="ipfs://..."
            required
          />
          <p className="text-xs text-muted-foreground">URI to the metadata JSON file for the subscription NFT.</p>
        </div>
      </div>

      <Button type="submit" disabled={loading || !isFormValid()} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Plan...
          </>
        ) : (
          "Create Subscription Plan"
        )}
      </Button>

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
    </form>
  )
}
