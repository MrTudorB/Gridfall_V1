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
    uint256 public constant DEPOSIT_AMOUNT = 0.001 ether; // Testnet-friendly: 0.001 ETH per player
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

    /**
     * @notice Start the game (admin only)
     * @dev Triggers iExec iApp to generate roles
     */
    function startGame() external onlyOwner {
        require(gameStatus == GameStatus.PENDING, "Game already started");
        require(players.length == TOTAL_PLAYERS, "Need 10 players");

        gameStatus = GameStatus.ACTIVE;

        // In production, this will trigger iExec iApp
        // For now, we'll use a mock callback in tests
        emit GameStarted(block.timestamp);
    }

    /**
     * @notice Ping another player
     * @param target Address to ping
     * @dev NO event emission to keep scanner identity private
     */
    function ping(address target) external {
        require(gameStatus == GameStatus.ACTIVE, "Game not active");
        require(!isEliminated[msg.sender], "You are eliminated");
        require(hasJoined[target], "Target not in game");
        require(target != msg.sender, "Cannot ping yourself");
        require(!isEliminated[target], "Target already eliminated");

        // In production, this triggers iExec scan
        // The iApp will call _pingCallback with elimination result
        // For testing, we'll call _pingCallback manually
    }

    /**
     * @notice Exit game early and receive 50% refund
     * @dev Counts as activity in TEE
     */
    function safeExit() external nonReentrant {
        require(gameStatus == GameStatus.ACTIVE, "Game not active");
        require(!isEliminated[msg.sender], "Already eliminated");
        require(hasJoined[msg.sender], "Not in game");

        // Mark as eliminated
        isEliminated[msg.sender] = true;
        eliminatedCount++;

        // Calculate refund (50% of deposit)
        uint256 refund = (DEPOSIT_AMOUNT * SAFE_EXIT_REFUND_PERCENT) / 100;
        prizePool -= refund;

        // Transfer refund
        (bool success, ) = msg.sender.call{value: refund}("");
        require(success, "Refund failed");

        emit PlayerSafeExit(msg.sender, refund);
        emit PlayerEliminated(msg.sender);
    }

    /**
     * @notice End the game and calculate winners (admin only)
     * @dev Triggers iExec to determine winners
     */
    function endGame() external onlyOwner {
        require(gameStatus == GameStatus.ACTIVE, "Game not active");

        // In production, this triggers iExec winner calculation
        // For testing, we'll call _endGameCallback manually with mock winners
    }

    /**
     * @notice Claim prize if you're a winner
     */
    function claimPrize() external nonReentrant {
        require(gameStatus == GameStatus.FINISHED, "Game not finished");
        require(claimableAmount[msg.sender] > 0, "No prize to claim");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 amount = claimableAmount[msg.sender];
        hasClaimed[msg.sender] = true;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(msg.sender, amount);
    }

    // ============ iExec Callback Functions (Mock for now) ============

    /**
     * @notice Set iExec app address (admin only)
     * @dev In production, this is called during deployment
     */
    function setIexecAppAddress(address _iexecAppAddress) external onlyOwner {
        iexecAppAddress = _iexecAppAddress;
    }

    /**
     * @notice iExec callback - role generation complete
     * @param _protectedDataAddress Data Protector address for encrypted roles
     */
    function _roleGenerationCallback(bytes32 _protectedDataAddress) external onlyIexecApp {
        protectedDataAddress = _protectedDataAddress;
    }

    /**
     * @notice iExec callback - ping result
     * @param eliminated Address of eliminated player (or address(0) if none)
     */
    function _pingCallback(address eliminated) external onlyIexecApp {
        if (eliminated != address(0)) {
            require(!isEliminated[eliminated], "Already eliminated");
            isEliminated[eliminated] = true;
            eliminatedCount++;
            emit PlayerEliminated(eliminated);
        }
    }

    /**
     * @notice iExec callback - game end with winner list
     * @param _winners Array of winner addresses
     */
    function _endGameCallback(address[] memory _winners) external onlyIexecApp nonReentrant {
        require(gameStatus == GameStatus.ACTIVE, "Game not active");

        gameStatus = GameStatus.FINISHED;
        winners = _winners;

        // Calculate protocol fee (5%)
        uint256 protocolFee = (prizePool * PROTOCOL_FEE_PERCENT) / 100;
        uint256 winnersPool = prizePool - protocolFee;

        // Transfer protocol fee to owner
        (bool feeSuccess, ) = owner().call{value: protocolFee}("");
        require(feeSuccess, "Fee transfer failed");
        emit ProtocolFeeCollected(protocolFee);

        // Calculate prize per winner
        if (_winners.length > 0) {
            uint256 prizePerWinner = winnersPool / _winners.length;

            for (uint256 i = 0; i < _winners.length; i++) {
                claimableAmount[_winners[i]] = prizePerWinner;
            }
        }

        emit GameEnded(block.timestamp, _winners.length);
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
