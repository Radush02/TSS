

async function main() {
    const [deployer] = await ethers.getSigners();

    const EventFactory = await ethers.getContractFactory("RetailerFactory");
    const factory = await EventFactory.deploy();

    await factory.waitForDeployment();
    console.log("factory: ",await factory.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
