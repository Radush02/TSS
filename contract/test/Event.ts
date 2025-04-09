import { expect } from "chai";
import { ethers } from "hardhat";

describe("Event", function () {
    let Event, event, owner, user, otherUser;

    beforeEach(async function () {
        [owner, user, otherUser] = await ethers.getSigners();

        Event = await ethers.getContractFactory("Event");
        event = await Event.deploy(
            "Festival Rockstadt",
            ethers.parseEther("0.1"),
            50,
            "Un concert rock!","https://i.imgflip.com/8q7uek.jpg"
        );
        await event.deploymentTransaction()?.wait(1);
        await owner.sendTransaction({ to: await event.getAddress(), value: ethers.parseEther("1.0") });
    });

    it("Should allow refund if event is canceled", async function () {
        await event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") });
        await event.connect(owner).anuleazaEvent();

        const ticketId = 1;
        await expect(
            event.connect(user).refundBilet(ticketId)
        )
        .to.emit(event, "RefundCerut")
        .withArgs(user.address, ticketId);

        const sumaRetragere = await event.retrageri(user.address);
        expect(sumaRetragere).to.equal(ethers.parseEther("0.1"));
    });

    it("Should allow a user to buy a ticket through Event contract", async function () {
        await expect(
            event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") })
        )
        .to.emit(event, "BiletCumparatEvent")
        .withArgs(user.address);
    });

    it("Should not allow ticket purchase if event is canceled", async function () {
        await event.connect(owner).anuleazaEvent();

        await expect(
            event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Evenimentul este anulat");
    });

    it("Should fail refund if event is not canceled", async function () {
        await event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") });

        const ticketId = 1;
        await expect(
            event.connect(user).refundBilet(ticketId)
        ).to.be.revertedWith("Evenimentul nu este anulat");
    });

    it("Should store refund amount in retrageri", async function () {
        await event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") });
        await event.connect(owner).anuleazaEvent();

        const ticketId = 1;
        await event.connect(user).refundBilet(ticketId);

        const sumaRetragere = await event.retrageri(user.address);
        expect(sumaRetragere).to.equal(ethers.parseEther("0.1"));
    });

    it("Should allow user to withdraw refund", async function () {
        await event.connect(user).cumparaBilet({ value: ethers.parseEther("0.1") });
        await event.connect(owner).anuleazaEvent();

        const ticketId = 1;
        await event.connect(user).refundBilet(ticketId);

        const balantaInitiala = await ethers.provider.getBalance(user.address);

        const tx = await event.connect(user).withdraw();
        const rez = await tx.wait();
        const gasUsed = rez.gasUsed * rez.gasPrice;

        const balantaFin = await ethers.provider.getBalance(user.address);

        expect(balantaFin).to.be.closeTo(balantaInitiala + ethers.parseEther("0.1"), gasUsed);
    });

    it("Should not allow withdrawal if there are no funds", async function () {
        await expect(event.connect(user).withdraw()).to.be.revertedWith("Nu ai fonduri de retras");
    });
    it("should fail when trying to buy more tickets than available", async function () {
        const ticketPrice = ethers.parseEther("0.1");
        const availableTickets = 50;
        for (let i = 0; i < availableTickets; i++) {
            await event.connect(user).cumparaBilet({ value: ticketPrice });
        }
        await expect(event.connect(user).cumparaBilet({ value: ticketPrice }))
            .to.be.revertedWith("Nu mai sunt bilete disponibile");
    });
});