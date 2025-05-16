declare global {
  interface Window {
    ethereum?: any
  }
}

export interface PlanInfo {
  id: number
  address: string
  retailer: string
  price: string
  duration: string
  available: string
}
