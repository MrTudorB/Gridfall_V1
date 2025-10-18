// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GridfallGame
 * @notice A zero-knowledge survival game where 10 players compete with hidden roles
 * @dev Roles are encrypted via iExec Data Protector and managed in TEE
 */
contract GridfallGame is Ownable, ReentrancyGuard {
    // ============ Game Configuration ============

    uint256 public constant TOTAL_PLAYERS = 10;
    uint256 public constant DEPOSIT_AMOUNT = 0.1 ether;
    uint256 public constant PROTOCOL_FEE_PERCENT = 5; // 5%
    uint256 public constant SAFE_EXIT_REFUND_PERCENT = 50; // 50%

    // ============ Game Status ============

    enum GameStatus {
        PENDING,   // Waiting for players
        ACTIVE,    // Game in progress
        FINISHED   // Game ended
    }

    GameStatus public gameStatus;

    // ============ Player Tracking ============

    address[] public players;
    mapping(address => bool) public hasJoined;
    mapping(address => bool) public isEliminated;
    uint256 public eliminatedCount;

    // ============ iExec Integration ============

    address public iexecAppAddress;
    bytes32 public protectedDataAddress; // Data Protector encrypted role map

    // ============ Prize Pool ============

    uint256 public prizePool;

    // ============ Winners ============

    address[] public winners;
    mapping(address => uint256) public claimableAmount;
    mapping(address => bool) public hasClaimed;

    // ============ Events ============

    event PlayerJoined(address indexed player, uint256 totalPlayers);
    event GameStarted(uint256 timestamp);
    event PlayerEliminated(address indexed player);
    event PlayerSafeExit(address indexed player, uint256 refundAmount);
    event GameEnded(uint256 timestamp, uint256 winnerCount);
    event PrizeClaimed(address indexed winner, uint256 amount);
    event ProtocolFeeCollected(uint256 amount);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        gameStatus = GameStatus.PENDING;
    }

    // ============ Modifiers ============

    modifier onlyIexecApp() {
        require(msg.sender == iexecAppAddress, "Only iExec app can call");
        _;
    }

    // ============ Player Functions ============

    /**
     * @notice Join the game by depositing DEPOSIT_AMOUNT
     */
    function joinGame() external payable {
        require(gameStatus == GameStatus.PENDING, "Game not open");
        require(players.length < TOTAL_PLAYERS, "Game full");
        require(msg.value == DEPOSIT_AMOUNT, "Incorrect deposit");
        require(!hasJoined[msg.sender], "Already joined");

        players.push(msg.sender);
        hasJoined[msg.sender] = true;
        prizePool += msg.value;

        emit PlayerJoined(msg.sender, players.length);
    }

    // ============ View Functions ============

    /**
     * @notice Get total players remaining (not eliminated)
     */
    function getPlayersRemaining() external view returns (uint256) {
        return TOTAL_PLAYERS - eliminatedCount;
    }

    /**
     * @notice Get all player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    /**
     * @notice Get all eliminated player addresses
     */
    function getEliminatedPlayers() external view returns (address[] memory) {
        address[] memory eliminated = new address[](eliminatedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < players.length; i++) {
            if (isEliminated[players[i]]) {
                eliminated[index++] = players[i];
            }
        }

        return eliminated;
    }

    /**
     * @notice Get winner addresses
     */
    function getWinners() external view returns (address[] memory) {
        return winners;
    }

    /**
     * @notice Check if address is a winner
     */
    function isWinner(address player) external view returns (bool) {
        return claimableAmount[player] > 0;
    }
}
