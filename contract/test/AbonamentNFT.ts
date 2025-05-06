import { expect } from "chai";
import { ethers } from "hardhat";


describe("AbonamentNFT", function () {
  let AbonamentNFT:any, nft:any, owner:any, planContract:any, other:any;
  const price = ethers.parseEther("1");
  const metadataURI = "ipfs://token";

  beforeEach(async function () {
    [owner, planContract, other] = await ethers.getSigners();
    AbonamentNFT = await ethers.getContractFactory("AbonamentNFT");
    nft = await AbonamentNFT.deploy(
      "Retail",
      "SYM",
      price,
      planContract.address,
      metadataURI,
      owner.address
    );
    await nft.waitForDeployment();
  });

  it("reverts on zero price", async function () {
    await expect(
      AbonamentNFT.deploy("R","S",0,planContract.address,metadataURI,owner.address)
    ).to.be.revertedWith("Price cannot be zero");
  });

  it("reverts on zero plan address", async function () {
    await expect(
      AbonamentNFT.deploy("R","S",price,ethers.ZeroAddress,metadataURI,owner.address)
    ).to.be.revertedWith("Invalid contract address");
  });

  it("reverts on empty metadata", async function () {
    await expect(
      AbonamentNFT.deploy("R","S",price,planContract.address,"",owner.address)
    ).to.be.revertedWith("Metadata URI cannot be empty");
  });

  it("mint and transfer ETH to plan", async function () {
    await expect(
      nft.connect(other).cumparaAbonament(other.address, { value: price })
    )
      .to.emit(nft, "AbonamentCumparat")
      .withArgs(other.address, 1);
    expect(await nft.ownerOf(1)).to.equal(other.address);
  });

  it("reverts on wrong ETH amount", async function () {
    await expect(
      nft.connect(other).cumparaAbonament(other.address, { value: price - 1n })
    ).to.be.revertedWith("Suma ETH gresita");
  });
  it("allows plan contract to refund transfer", async function () {
    await nft.connect(other).cumparaAbonament(other.address, { value: price });
      await expect(
      nft.connect(planContract).refundTransfer(other.address, owner.address, 1)
    )
      .to.emit(nft, "Transfer")
      .withArgs(other.address, owner.address, 1);
    expect(await nft.ownerOf(1)).to.equal(owner.address);
  });
  it("tracks balances and enumeration on mint", async () => {
    expect(await nft.balanceOf(other.address)).to.equal(0);
    await nft.connect(other).cumparaAbonament(other.address, { value: price });
    expect(await nft.balanceOf(other.address)).to.equal(1);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.tokenOfOwnerByIndex(other.address, 0)).to.equal(1);
  });

  it("supports the ERC-721, Metadata and Enumerable interfaces", async () => {
    // ERC-721
    expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
    // ERC-721 Metadata
    expect(await nft.supportsInterface("0x5b5e139f")).to.be.true;
    // ERC-721 Enumerable
    expect(await nft.supportsInterface("0x780e9d63")).to.be.true;
  });

  it("returns the correct tokenURI", async () => {
    await nft.connect(other).cumparaAbonament(other.address, { value: price });
    expect(await nft.tokenURI(1)).to.equal(metadataURI);
  });

  it("reverts refundTransfer when called by non-plan contract", async () => {
    await nft.connect(other).cumparaAbonament(other.address, { value: price });
    await expect(
      nft.connect(other).refundTransfer(other.address, owner.address, 1)
    ).to.be.revertedWith("Neautorizat");
  });
});




