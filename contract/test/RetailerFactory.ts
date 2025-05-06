import { expect } from "chai";
import { ethers } from "hardhat";

describe("RetailerFactory", function () {
    let Factory, factory:any, owner, other:any;
    const metadataURI = "ipfs://m";
  
    beforeEach(async function () {
      [owner, other] = await ethers.getSigners();
      Factory = await ethers.getContractFactory("RetailerFactory");
      factory = await Factory.deploy(owner.address);
      await factory.waitForDeployment();
    });
  
    it("reverts non-owner create", async function () {
      await expect(
        factory.connect(other).createSubscriptionPlan("R",1,1,1,"d",metadataURI)
      ).to.be.reverted;
    });
  
    it("reverts on invalid inputs", async function () {
      await expect(
        factory.createSubscriptionPlan("",1,1,1,"d",metadataURI)
      ).to.be.revertedWith("Retailer name cannot be empty");
      await expect(
        factory.createSubscriptionPlan("R",0,1,1,"d",metadataURI)
      ).to.be.revertedWith("Price cannot be zero");
      await expect(
        factory.createSubscriptionPlan("R",1,1,1,"d","")
      ).to.be.revertedWith("Metadata URI cannot be empty");
    });
  
    it("creates plan and emits", async function () {
      await expect(
        factory.createSubscriptionPlan("R", 1, 2, 3, "d", metadataURI)
      ).to.emit(factory, "PlanCreated");
      const addr = await factory.abonamente(0);
      const Plan = await ethers.getContractFactory("PlanAbonament");
      const plan = await Plan.attach(addr) as any;
      expect(await plan.retailer()).to.equal("R");
      expect(await factory.nextPlanId()).to.equal(1);
    });
  });
  