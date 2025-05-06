import { expect } from "chai";
import { ethers } from "hardhat";

describe("PlanAbonament", function () {
  let PlanAbonament:any, plan:any, owner:any, subscriber:any, other:any;
  const price = ethers.parseEther("1");
  const metadataURI = "ipfs://sub";
  const duration = 30;
  const supply = 2;
  const desc = "desc";

  beforeEach(async function () {
    [owner, subscriber, other] = await ethers.getSigners();
    PlanAbonament = await ethers.getContractFactory("PlanAbonament");
    plan = await PlanAbonament.deploy(
      "Shop",
      price,
      duration,
      supply,
      desc,
      metadataURI,
      owner.address
    );
    await plan.waitForDeployment();
  });

  it("reverts on empty retailer", async function () {
    await expect(
      PlanAbonament.deploy("",price,duration,supply,desc,metadataURI,owner.address)
    ).to.be.revertedWith("Retailer name cannot be empty");
  });

  it("reverts on zero price", async function () {
    await expect(
      PlanAbonament.deploy("X",0,duration,supply,desc,metadataURI,owner.address)
    ).to.be.revertedWith("Price cannot be zero");
  });

  it("reverts on empty metadata", async function () {
    await expect(
      PlanAbonament.deploy("X",price,duration,supply,desc,"",owner.address)
    ).to.be.revertedWith("Metadata URI cannot be empty");
  });

  it("buy subscription reduces supply and emits", async function () {
    await expect(
      plan.connect(subscriber).cumparaSubscriptie({ value: price })
    ).to.emit(plan, "AbonamentCumparat")
      .withArgs(subscriber.address);
    expect(await plan.abonamenteDisp()).to.equal(supply - 1);
  });

  it("reverts buy on wrong ETH", async function () {
    await expect(
      plan.connect(subscriber).cumparaSubscriptie({ value: price - 1n })
    ).to.be.revertedWith("Incorrect ETH amount");
  });

  it("reverts buy when cancelled", async function () {
    await plan.connect(owner).cancelPlan();
    await expect(
      plan.connect(subscriber).cumparaSubscriptie({ value: price })
    ).to.be.revertedWith("Abonament anulat");
  });

  it("reverts buy when sold out", async function () {
    await plan.connect(subscriber).cumparaSubscriptie({ value: price });
    await plan.connect(subscriber).cumparaSubscriptie({ value: price });
    await expect(
      plan.connect(subscriber).cumparaSubscriptie({ value: price })
    ).to.be.revertedWith("No subscriptii available");
  });
  it("refund flow and withdraw", async function () {
    const price = ethers.parseEther("1.0");
    await plan.connect(subscriber).cumparaSubscriptie({ value: price });
    await plan.connect(owner).cancelPlan();
    const tokenId = 1;
    await expect(
        plan.connect(subscriber).refundSubscriptie(tokenId)
    ).to.emit(plan, "RefundRequested")
      .withArgs(subscriber.address, tokenId);
    const balBefore = await ethers.provider.getBalance(subscriber.address);
    const tx = await plan.connect(subscriber).withdraw();
    const receipt = await tx.wait();
    let gasUsed = receipt?.gasUsed || 0n;
    let effectiveGasPrice = receipt?.effectiveGasPrice || (await ethers.provider.getFeeData()).gasPrice || 0n;
    const gasCost = gasUsed * effectiveGasPrice;
    const balAfter = await ethers.provider.getBalance(subscriber.address);
    expect(balAfter).to.be.closeTo(balBefore + price - BigInt(gasCost), 10n ** 15n);
});

  it("reverts refund when not cancelled then processes refunds when cancelled", async function () {
    await plan.connect(subscriber).cumparaSubscriptie({ value: price });
    await expect(
      plan.connect(subscriber).refundSubscriptie(1)
    ).to.be.revertedWith("Plan is not cancelled");
    await plan.connect(owner).cancelPlan();
    await expect(
      plan.connect(subscriber).refundSubscriptie(1)
    ).to.emit(plan, 'RefundRequested');
  });

  it("returns its ERC-721Receiver selector", async () => {
    const signature = "onERC721Received(address,address,uint256,bytes)";
    const selector = ethers
      .keccak256(ethers.toUtf8Bytes(signature))
      .slice(0, 10);
    expect(
      await plan.onERC721Received(owner.address, other.address, 1, "0x")
    ).to.equal(selector);
  });

  it("can refund via testCallRefund helper", async () => {
    await plan.connect(subscriber).cumparaSubscriptie({ value: price });
    const nftAddress = await plan.abonamentNFT();
    const NFT = await ethers.getContractAt("AbonamentNFT", nftAddress);
    expect(await NFT.ownerOf(1)).to.equal(subscriber.address);
    await expect(
      plan.connect(owner).testCallRefund(nftAddress, subscriber.address, owner.address, 1)
    )
      .to.emit(NFT, "Transfer")
      .withArgs(subscriber.address, owner.address, 1);

    expect(await NFT.ownerOf(1)).to.equal(owner.address);
  });

  describe("Calculate discount", function () {
  
    it("apply 5% discount for quantitiy < 10", async () => {
      const net = await plan.calculeazaDiscount(ethers.parseEther("2"), 5);
      expect(net).to.equal(ethers.parseEther("9.5"));
    });
  
    it("apply 10% discount for quantity <=50 and eth >=1", async () => {
      const net = await plan.calculeazaDiscount(ethers.parseEther("2"), 20);
      expect(net).to.equal(ethers.parseEther("36"));
    });
  
    it("apply 15% for other cases", async () => {
      const net = await plan.calculeazaDiscount(ethers.parseEther("0.5"), 100);
      expect(net).to.equal(ethers.parseEther("42.5")); 
    });
  });
});