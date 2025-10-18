import { expect } from "chai";
import hre from "hardhat";
import { GridfallGame } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("GridfallGame - Complete Game Flow", function () {
  let game: GridfallGame;
  let owner: HardhatEthersSigner;
  let players: HardhatEthersSigner[];
  let mockIexecApp: HardhatEthersSigner;

  const DEPOSIT_AMOUNT = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, mockIexecApp, ...players] = await ethers.getSigners();

    // Deploy contract
    const GridfallGame = await ethers.getContractFactory("GridfallGame");
    game = await GridfallGame.deploy();
    await game.waitForDeployment();

    // Set mock iExec app address
    await game.setIexecAppAddress(mockIexecApp.address);

    // Join 10 players
    for (let i = 0; i < 10; i++) {
      await game.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
    }
  });

  describe("Start Game", function () {
    it("Should allow owner to start game when 10 players joined", async function () {
      await expect(game.startGame())
        .to.emit(game, "GameStarted");

      expect(await game.gameStatus()).to.equal(1); // ACTIVE
    });

    it("Should reject start if not enough players", async function () {
      // Deploy fresh contract
      const GridfallGame = await ethers.getContractFactory("GridfallGame");
      const freshGame = await GridfallGame.deploy();

      // Join only 5 players
      for (let i = 0; i < 5; i++) {
        await freshGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }

      await expect(freshGame.startGame()).to.be.revertedWith("Need 10 players");
    });

    it("Should reject start from non-owner", async function () {
      await expect(
        game.connect(players[0]).startGame()
      ).to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");
    });

    it("Should reject double start", async function () {
      await game.startGame();
      await expect(game.startGame()).to.be.revertedWith("Game already started");
    });
  });

  describe("Ping Function", function () {
    beforeEach(async function () {
      await game.startGame();
    });

    it("Should allow active player to ping another player", async function () {
      await expect(
        game.connect(players[0]).ping(players[1].address)
      ).to.not.be.reverted;
    });

    it("Should reject ping before game starts", async function () {
      // Deploy fresh contract
      const GridfallGame = await ethers.getContractFactory("GridfallGame");
      const freshGame = await GridfallGame.deploy();

      for (let i = 0; i < 10; i++) {
        await freshGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }

      await expect(
        freshGame.connect(players[0]).ping(players[1].address)
      ).to.be.revertedWith("Game not active");
    });

    it("Should reject ping of non-player", async function () {
      await expect(
        game.connect(players[0]).ping(ethers.Wallet.createRandom().address)
      ).to.be.revertedWith("Target not in game");
    });

    it("Should reject self-ping", async function () {
      await expect(
        game.connect(players[0]).ping(players[0].address)
      ).to.be.revertedWith("Cannot ping yourself");
    });

    it("Should reject ping from eliminated player", async function () {
      // Eliminate player 0 via callback
      await game.connect(mockIexecApp)._pingCallback(players[0].address);

      await expect(
        game.connect(players[0]).ping(players[1].address)
      ).to.be.revertedWith("You are eliminated");
    });

    it("Should reject ping of eliminated player", async function () {
      // Eliminate player 1
      await game.connect(mockIexecApp)._pingCallback(players[1].address);

      await expect(
        game.connect(players[0]).ping(players[1].address)
      ).to.be.revertedWith("Target already eliminated");
    });
  });

  describe("Ping Callback", function () {
    beforeEach(async function () {
      await game.startGame();
    });

    it("Should allow iExec app to eliminate player via callback", async function () {
      await expect(
        game.connect(mockIexecApp)._pingCallback(players[0].address)
      ).to.emit(game, "PlayerEliminated")
        .withArgs(players[0].address);

      expect(await game.isEliminated(players[0].address)).to.be.true;
      expect(await game.eliminatedCount()).to.equal(1);
    });

    it("Should handle no-elimination callback (Echo pings)", async function () {
      await expect(
        game.connect(mockIexecApp)._pingCallback(ethers.ZeroAddress)
      ).to.not.emit(game, "PlayerEliminated");

      expect(await game.eliminatedCount()).to.equal(0);
    });

    it("Should reject callback from non-iExec address", async function () {
      await expect(
        game.connect(players[0])._pingCallback(players[1].address)
      ).to.be.revertedWith("Only iExec app can call");
    });

    it("Should reject double elimination", async function () {
      await game.connect(mockIexecApp)._pingCallback(players[0].address);

      await expect(
        game.connect(mockIexecApp)._pingCallback(players[0].address)
      ).to.be.revertedWith("Already eliminated");
    });
  });

  describe("Safe Exit", function () {
    beforeEach(async function () {
      await game.startGame();
    });

    it("Should allow player to safe exit and receive 50% refund", async function () {
      const balanceBefore = await ethers.provider.getBalance(players[0].address);

      const tx = await game.connect(players[0]).safeExit();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(players[0].address);

      const expectedRefund = ethers.parseEther("0.05"); // 50% of 0.1
      const actualGain = balanceAfter + gasUsed - balanceBefore;

      expect(actualGain).to.equal(expectedRefund);
      expect(await game.isEliminated(players[0].address)).to.be.true;
      expect(await game.eliminatedCount()).to.equal(1);
    });

    it("Should emit events on safe exit", async function () {
      await expect(game.connect(players[0]).safeExit())
        .to.emit(game, "PlayerSafeExit")
        .withArgs(players[0].address, ethers.parseEther("0.05"))
        .and.to.emit(game, "PlayerEliminated")
        .withArgs(players[0].address);
    });

    it("Should reduce prize pool after safe exit", async function () {
      const poolBefore = await game.prizePool();
      await game.connect(players[0]).safeExit();
      const poolAfter = await game.prizePool();

      expect(poolBefore - poolAfter).to.equal(ethers.parseEther("0.05"));
    });

    it("Should reject safe exit when not active", async function () {
      // Fresh game
      const GridfallGame = await ethers.getContractFactory("GridfallGame");
      const freshGame = await GridfallGame.deploy();
      await freshGame.connect(players[0]).joinGame({ value: DEPOSIT_AMOUNT });

      await expect(
        freshGame.connect(players[0]).safeExit()
      ).to.be.revertedWith("Game not active");
    });

    it("Should reject safe exit if already eliminated", async function () {
      await game.connect(players[0]).safeExit();

      await expect(
        game.connect(players[0]).safeExit()
      ).to.be.revertedWith("Already eliminated");
    });
  });

  describe("End Game and Prize Distribution", function () {
    beforeEach(async function () {
      await game.startGame();
    });

    it("Should allow owner to end game", async function () {
      // Simulate some eliminations
      await game.connect(mockIexecApp)._pingCallback(players[0].address);
      await game.connect(mockIexecApp)._pingCallback(players[1].address);

      await expect(game.endGame()).to.not.be.reverted;
    });

    it("Should correctly distribute prizes with protocol fee", async function () {
      // Eliminate 5 players (winners: 5)
      for (let i = 0; i < 5; i++) {
        await game.connect(mockIexecApp)._pingCallback(players[i].address);
      }

      const winners = [
        players[5].address,
        players[6].address,
        players[7].address,
        players[8].address,
        players[9].address,
      ];

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      // End game with callback
      const tx = await game.connect(mockIexecApp)._endGameCallback(winners);
      await tx.wait();

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Prize pool = 1 ETH (10 * 0.1)
      // Protocol fee = 0.05 ETH (5%)
      // Winners pool = 0.95 ETH
      // Per winner = 0.19 ETH

      const expectedFee = ethers.parseEther("0.05");
      const expectedPrizePerWinner = ethers.parseEther("0.19");

      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedFee);
      expect(await game.claimableAmount(players[5].address)).to.equal(expectedPrizePerWinner);
      expect(await game.gameStatus()).to.equal(2); // FINISHED
    });

    it("Should emit events on game end", async function () {
      const winners = [players[5].address];

      await expect(
        game.connect(mockIexecApp)._endGameCallback(winners)
      )
        .to.emit(game, "ProtocolFeeCollected")
        .and.to.emit(game, "GameEnded");
    });

    it("Should handle game with 1 winner", async function () {
      const winners = [players[0].address];

      await game.connect(mockIexecApp)._endGameCallback(winners);

      // 1 ETH pool - 0.05 ETH fee = 0.95 ETH for 1 winner
      expect(await game.claimableAmount(players[0].address)).to.equal(ethers.parseEther("0.95"));
    });

    it("Should handle game with no winners (all inactive)", async function () {
      const winners: string[] = [];

      const tx = await game.connect(mockIexecApp)._endGameCallback(winners);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(game, "GameEnded")
        .withArgs(block!.timestamp, 0);

      // All funds go to protocol fee
      expect(await game.getWinners()).to.deep.equal([]);
    });

    it("Should reject end game from non-owner", async function () {
      await expect(
        game.connect(players[0]).endGame()
      ).to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");
    });
  });

  describe("Claim Prize", function () {
    beforeEach(async function () {
      await game.startGame();

      // End game with player 0 as winner
      const winners = [players[0].address];
      await game.connect(mockIexecApp)._endGameCallback(winners);
    });

    it("Should allow winner to claim prize", async function () {
      const balanceBefore = await ethers.provider.getBalance(players[0].address);
      const claimable = await game.claimableAmount(players[0].address);

      const tx = await game.connect(players[0]).claimPrize();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(players[0].address);
      const actualGain = balanceAfter + gasUsed - balanceBefore;

      expect(actualGain).to.equal(claimable);
      expect(await game.hasClaimed(players[0].address)).to.be.true;
    });

    it("Should emit PrizeClaimed event", async function () {
      const claimable = await game.claimableAmount(players[0].address);

      await expect(game.connect(players[0]).claimPrize())
        .to.emit(game, "PrizeClaimed")
        .withArgs(players[0].address, claimable);
    });

    it("Should reject claim from non-winner", async function () {
      await expect(
        game.connect(players[1]).claimPrize()
      ).to.be.revertedWith("No prize to claim");
    });

    it("Should reject double claim", async function () {
      await game.connect(players[0]).claimPrize();

      await expect(
        game.connect(players[0]).claimPrize()
      ).to.be.revertedWith("Already claimed");
    });

    it("Should reject claim before game ends", async function () {
      // Fresh game
      const GridfallGame = await ethers.getContractFactory("GridfallGame");
      const freshGame = await GridfallGame.deploy();

      for (let i = 0; i < 10; i++) {
        await freshGame.connect(players[i]).joinGame({ value: DEPOSIT_AMOUNT });
      }

      await freshGame.startGame();

      await expect(
        freshGame.connect(players[0]).claimPrize()
      ).to.be.revertedWith("Game not finished");
    });
  });

  describe("Full Game Simulation", function () {
    it("Should complete entire game flow successfully", async function () {
      // Game already has 10 players joined from beforeEach

      // 1. Start game
      await game.startGame();
      expect(await game.gameStatus()).to.equal(1); // ACTIVE

      // 2. Players ping (simulated)
      await game.connect(players[0]).ping(players[1].address);
      await game.connect(players[2]).ping(players[3].address);

      // 3. Some players get eliminated via iExec callbacks
      await game.connect(mockIexecApp)._pingCallback(players[1].address);
      await game.connect(mockIexecApp)._pingCallback(players[3].address);

      // 4. One player safe exits
      await game.connect(players[4]).safeExit();
      expect(await game.eliminatedCount()).to.equal(3);

      // 5. End game with winners
      const winners = [
        players[0].address,
        players[2].address,
        players[5].address,
      ];

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await game.connect(mockIexecApp)._endGameCallback(winners);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Verify game ended
      expect(await game.gameStatus()).to.equal(2); // FINISHED

      // Verify protocol fee collected
      const expectedFee = ethers.parseEther("0.0475"); // 5% of (1 - 0.05 safe exit refund)
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        expectedFee,
        ethers.parseEther("0.001")
      );

      // 6. Winners claim prizes
      await game.connect(players[0]).claimPrize();
      await game.connect(players[2]).claimPrize();
      await game.connect(players[5]).claimPrize();

      // Verify all claimed
      expect(await game.hasClaimed(players[0].address)).to.be.true;
      expect(await game.hasClaimed(players[2].address)).to.be.true;
      expect(await game.hasClaimed(players[5].address)).to.be.true;
    });
  });
});
