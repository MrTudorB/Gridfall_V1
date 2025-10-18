import { expect } from "chai";
import hre from "hardhat";
import { GridfallGame } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("GridfallGame", function () {
  let gridfallGame: GridfallGame;
  let owner: HardhatEthersSigner;
  let players: HardhatEthersSigner[];

  const DEPOSIT_AMOUNT = ethers.parseEther("0.001");

  beforeEach(async function () {
    // Get signers
    [owner, ...players] = await ethers.getSigners();

    // Deploy contract
    const GridfallGame = await ethers.getContractFactory("GridfallGame");
    gridfallGame = await GridfallGame.deploy();
    await gridfallGame.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gridfallGame.owner()).to.equal(owner.address);
    });

    it("Should initialize with PENDING status", async function () {
      expect(await gridfallGame.gameStatus()).to.equal(0); // GameStatus.PENDING
    });

    it("Should have correct constants", async function () {
      expect(await gridfallGame.TOTAL_PLAYERS()).to.equal(10);
      expect(await gridfallGame.DEPOSIT_AMOUNT()).to.equal(DEPOSIT_AMOUNT);
      expect(await gridfallGame.PROTOCOL_FEE_PERCENT()).to.equal(5);
      expect(await gridfallGame.SAFE_EXIT_REFUND_PERCENT()).to.equal(50);
    });
  });

  describe("Join Game", function () {
    it("Should allow players to join with correct deposit", async function () {
      await expect(
        gridfallGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT })
      )
        .to.emit(gridfallGame, "PlayerJoined")
        .withArgs(players[0].address, 1);

      expect(await gridfallGame.hasJoined(players[0].address)).to.be.true;
      const allPlayers = await gridfallGame.getPlayers();
      expect(allPlayers.length).to.equal(1);
      expect(allPlayers[0]).to.equal(players[0].address);
    });

    it("Should reject join with incorrect deposit", async function () {
      await expect(
        gridfallGame.connect(players[0]).joinGame({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWith("Incorrect deposit");
    });

    it("Should reject if player already joined", async function () {
      await gridfallGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT });

      await expect(
        gridfallGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Already joined");
    });

    it("Should allow up to 10 players to join", async function () {
      for (let i = 0; i < 10; i++) {
        await gridfallGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }

      const allPlayers = await gridfallGame.getPlayers();
      expect(allPlayers.length).to.equal(10);
    });

    it("Should reject 11th player", async function () {
      // Join 10 players
      for (let i = 0; i < 10; i++) {
        await gridfallGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }

      // Try to join 11th player
      await expect(
        gridfallGame.connect(players[10]).joinGame({ value: DEPOSIT_AMOUNT })
      ).to.be.revertedWith("Game full");
    });

    it("Should accumulate prize pool correctly", async function () {
      await gridfallGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT });
      await gridfallGame.connect(players[1]).joinGame({ value: DEPOSIT_AMOUNT });

      expect(await gridfallGame.prizePool()).to.equal(ethers.parseEther("0.002"));
    });

    it("Should track players remaining correctly", async function () {
      expect(await gridfallGame.getPlayersRemaining()).to.equal(10);

      await gridfallGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT });
      expect(await gridfallGame.getPlayersRemaining()).to.equal(10);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Join 3 players for testing
      for (let i = 0; i < 3; i++) {
        await gridfallGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }
    });

    it("Should return correct player list", async function () {
      const allPlayers = await gridfallGame.getPlayers();
      expect(allPlayers.length).to.equal(3);
      expect(allPlayers[0]).to.equal(players[0].address);
      expect(allPlayers[1]).to.equal(players[1].address);
      expect(allPlayers[2]).to.equal(players[2].address);
    });

    it("Should initially have no eliminated players", async function () {
      const eliminated = await gridfallGame.getEliminatedPlayers();
      expect(eliminated.length).to.equal(0);
    });

    it("Should initially have no winners", async function () {
      const winners = await gridfallGame.getWinners();
      expect(winners.length).to.equal(0);
    });

    it("Should correctly identify non-winners", async function () {
      expect(await gridfallGame.isWinner(players[0].address)).to.be.false;
    });
  });
});
