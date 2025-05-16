import { ethers } from "hardhat";
import { expect } from "chai";
import fc from "fast-check";

describe("Integration and Property-based Tests for Subscription Contracts", function () {
  let RetailerFactory:any, PlanAbonament:any, AbonamentNFT;
  let factory: any;
  let plan: any;
  let nft: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  const initialSupply = 100;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    RetailerFactory = await ethers.getContractFactory("RetailerFactory");
    factory         = await RetailerFactory.connect(owner).deploy();
    await factory.waitForDeployment();

    await factory.createSubscriptionPlan(
      "BasicPlan",
      ethers.parseEther("0.1"),
      30,
      initialSupply,
      "Basic subscription plan",
      "ipfs://metadata"
    );
    const planAddress = await factory.abonamente(1);

    PlanAbonament = await ethers.getContractFactory("PlanAbonament");
    AbonamentNFT  = await ethers.getContractFactory("AbonamentNFT");
    plan = PlanAbonament.attach(planAddress);
    nft  = AbonamentNFT.attach(await plan.abonamentNFT());
  });

  it("should allow user to subscribe and mint NFT", async function () {
    await plan.connect(addr1).cumparaSubscriptie({ value: ethers.parseEther("0.1") });
    const balance = await nft.balanceOf(addr1.address);
    expect(balance).to.equal(1);
  });

  it("should reject insufficient payment", async function () {
    await expect(
      plan.connect(addr2).cumparaSubscriptie({ value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Incorrect ETH amount");
  });

  it("should enforce max supply limit", async function () {
    for (let i = 0; i < initialSupply; i++) {
      await plan.connect(owner).cumparaSubscriptie({ value: ethers.parseEther("0.1") });
    }
    await expect(
      plan.connect(addr1).cumparaSubscriptie({ value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("No subscriptii available");
  });

  it("invariant: sold + remaining = initial supply", async function () {
    await plan.connect(addr1).cumparaSubscriptie({ value: ethers.parseEther("0.1") });
    const remaining = await plan.abonamenteDisp();
    const sold = await nft.abonamenteVandute();
    const total = remaining + sold;
    expect(total).to.equal(BigInt(initialSupply));
  });

  it("random valid subscriptions should always succeed", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 365 }),
        fc.bigInt({ min: BigInt(1), max: ethers.parseEther("10") }),
        async (days, priceWei) => {
          const factoryFresh = await RetailerFactory.connect(owner).deploy();
          await factoryFresh.waitForDeployment();
          expect(factoryFresh.target).to.properAddress;
  
          const tx = await factoryFresh.createSubscriptionPlan(
            `Plan${days}`,
            priceWei,
            days,
            10,
            "FuzzPlan",
            "ipfs://m"
          );
          const receipt = await tx.wait();
            const iface = RetailerFactory.interface;
          let planAddr: string | null = null;
  
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed.name === "PlanCreated") {
                planAddr = parsed.args.adresa;
                break;
              }
            } catch (_) {
            }
          }
  
          if (!planAddr) {
            throw new Error("PlanCreated event not found in logs");
          }
  
          expect(planAddr).to.properAddress;
  
          const planFuzz = PlanAbonament.attach(planAddr);
          await expect(
            planFuzz.connect(addr1).cumparaSubscriptie({ value: priceWei })
          ).to.not.be.reverted;
        }
      ),
      {
        numRuns: 20,
        verbose: true,
      }
    );
  });
  

  describe("Gas Benchmark", function () {
    it("should measure gas cost for subscription", async function () {
      const tx = await plan.connect(addr1).cumparaSubscriptie({ value: ethers.parseEther("0.1") });
      const receipt = await tx.wait();
      console.log("GasUsed:", receipt.gasUsed.toString());
    });
  });
});
