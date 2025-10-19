'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { GRIDFALL_CONTRACT_ADDRESS, GRIDFALL_ABI } from '@/lib/contract';
import { useState, useEffect } from 'react';
import GameGrid from './components/GameGrid';
import Results from './components/Results';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Simulation mode state
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationGameState, setSimulationGameState] = useState<'lobby' | 'active' | 'finished'>('active');
  const [simulationEliminatedPlayers, setSimulationEliminatedPlayers] = useState<string[]>([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Mock data for simulation
  const mockPlayers = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
    '0x5678901234567890123456789012345678901234',
    '0x6789012345678901234567890123456789012345',
    '0x7890123456789012345678901234567890123456',
    '0x8901234567890123456789012345678901234567',
    '0x9012345678901234567890123456789012345678',
    '0x0123456789012345678901234567890123456789',
  ];
  const mockCurrentPlayer = mockPlayers[0];
  const mockPrizePool = BigInt('10000000000000000'); // 0.01 ETH

  // Simulation handlers
  const startSimulation = () => {
    setSimulationMode(true);
    setSimulationGameState('active');
    setSimulationEliminatedPlayers([]);
  };

  const exitSimulation = () => {
    setSimulationMode(false);
    setSimulationGameState('active');
    setSimulationEliminatedPlayers([]);
  };

  const handleSimulationElimination = (playerAddress: string) => {
    setSimulationEliminatedPlayers((prev) => [...prev, playerAddress]);
  };

  const endSimulationGame = () => {
    setSimulationGameState('finished');
  };

  // Write contract hooks
  const { data: joinHash, writeContract: joinGameWrite, isPending: isJoinPending } = useWriteContract();
  const { data: startHash, writeContract: startGameWrite, isPending: isStartPending } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isJoinConfirming, isSuccess: isJoinConfirmed } = useWaitForTransactionReceipt({
    hash: joinHash,
  });
  const { isLoading: isStartConfirming, isSuccess: isStartConfirmed } = useWaitForTransactionReceipt({
    hash: startHash,
  });

  // Read game data
  const { data: gameStatus, refetch: refetchGameStatus } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'gameStatus',
  });

  const { data: owner } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'owner',
  });

  const { data: players, refetch: refetchPlayers } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'getPlayers',
  });

  const { data: prizePool, refetch: refetchPrizePool } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'prizePool',
  });

  const { data: hasJoined, refetch: refetchHasJoined } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'hasJoined',
    args: address ? [address] : undefined,
  });

  const { data: depositAmount } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'DEPOSIT_AMOUNT',
  });

  // Handle join game
  const handleJoinGame = async () => {
    if (!depositAmount || isJoining) return;

    setIsJoining(true);
    try {
      joinGameWrite({
        address: GRIDFALL_CONTRACT_ADDRESS,
        abi: GRIDFALL_ABI,
        functionName: 'joinGame',
        value: depositAmount as bigint,
      });
    } catch (error) {
      console.error('Error joining game:', error);
      setIsJoining(false);
    }
  };

  // Handle start game
  const handleStartGame = async () => {
    if (isStarting) return;

    setIsStarting(true);
    try {
      startGameWrite({
        address: GRIDFALL_CONTRACT_ADDRESS,
        abi: GRIDFALL_ABI,
        functionName: 'startGame',
      });
    } catch (error) {
      console.error('Error starting game:', error);
      setIsStarting(false);
    }
  };

  // Reset joining state and refetch data when transaction is confirmed
  useEffect(() => {
    if (isJoinConfirmed) {
      setIsJoining(false);
      refetchGameStatus();
      refetchPlayers();
      refetchPrizePool();
      refetchHasJoined();
    }
  }, [isJoinConfirmed, refetchGameStatus, refetchPlayers, refetchPrizePool, refetchHasJoined]);

  // Reset starting state and refetch data when game start is confirmed
  useEffect(() => {
    if (isStartConfirmed) {
      setIsStarting(false);
      refetchGameStatus();
    }
  }, [isStartConfirmed, refetchGameStatus]);

  // Auto-refresh game data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGameStatus();
      refetchPlayers();
      refetchPrizePool();
      if (address) {
        refetchHasJoined();
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [address, refetchGameStatus, refetchPlayers, refetchPrizePool, refetchHasJoined]);

  const isJoinLoading = isJoinPending || isJoinConfirming;
  const isStartLoading = isStartPending || isStartConfirming;
  const canJoinGame = isConnected && !hasJoined && gameStatus === 0 && !isJoinLoading;
  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();
  const canStartGame = isOwner && gameStatus === 0 && players && (players as string[]).length === 10;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-cyan-950/20 to-black" />
      <div className="cyber-grid" />
      <div className="cyber-grid-glow" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-6 py-2 border-2 border-cyan-500 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-500 hover:text-black transition-all"
          >
            How to Play
          </button>
          <ConnectButton />
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8 mb-20">
            {/* Main Title */}
            <h1 className="text-8xl font-black tracking-wider text-gradient animate-pulse">
              GRIDFALL
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 uppercase tracking-widest">
              A Decentralized Battle Royale on Arbitrum
            </p>

            {/* Tagline */}
            <div className="flex items-center justify-center gap-4 text-sm text-cyan-400 uppercase tracking-wider">
              <span>Scan</span>
              <span className="text-gray-600">·</span>
              <span>Eliminate</span>
              <span className="text-gray-600">·</span>
              <span>Survive</span>
            </div>

            {/* CTA Button */}
            {!isConnected && (
              <div className="pt-8">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Players Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-black border border-cyan-500/30 rounded-2xl p-8 text-center">
                <div className="text-6xl font-black text-cyan-400 mb-2">
                  {players ? (players as string[]).length : '10'}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Players</div>
              </div>
            </div>

            {/* Entry Fee Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-black border border-cyan-500/30 rounded-2xl p-8 text-center">
                <div className="text-6xl font-black text-cyan-400 mb-2">
                  {depositAmount ? formatEther(depositAmount as bigint) : '0.001'}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">ETH Entry</div>
              </div>
            </div>

            {/* TEE Powered Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
              <div className="relative bg-black border border-purple-500/30 rounded-2xl p-8 text-center">
                <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  TEE
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Powered</div>
              </div>
            </div>
          </div>

          {/* Enter the Grid Button */}
          <div className="text-center">
            <div className="mb-4">
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="px-16 py-5 border-2 border-cyan-500 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-500 hover:text-black transition-all transform hover:scale-105 uppercase tracking-wider"
                    >
                      Connect Wallet to Enter
                    </button>
                  )}
                </ConnectButton.Custom>
              ) : hasJoined ? (
                <button
                  disabled
                  className="px-16 py-5 border-2 border-green-500 text-green-400 font-bold text-lg rounded-lg uppercase tracking-wider opacity-75 cursor-not-allowed"
                >
                  ✓ Already Joined
                </button>
              ) : gameStatus !== 0 ? (
                <button
                  disabled
                  className="px-16 py-5 border-2 border-gray-500 text-gray-400 font-bold text-lg rounded-lg uppercase tracking-wider opacity-75 cursor-not-allowed"
                >
                  Game {gameStatus === 1 ? 'In Progress' : 'Ended'}
                </button>
              ) : (
                <button
                  onClick={handleJoinGame}
                  disabled={!canJoinGame || isJoinLoading}
                  className="px-16 py-5 border-2 border-cyan-500 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-500 hover:text-black transition-all transform hover:scale-105 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-cyan-400"
                >
                  {isJoinLoading ? (
                    <span className="flex items-center gap-3">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isJoinPending ? 'Confirm in Wallet...' : 'Joining Game...'}
                    </span>
                  ) : (
                    `Enter the Grid (${depositAmount ? formatEther(depositAmount as bigint) : '0.001'} ETH)`
                  )}
                </button>
              )}
            </div>

            {/* Simulate Gameplay Button (for demo/judges) - Always show when not in simulation */}
            {!simulationMode && (
              <div>
                <button
                  onClick={startSimulation}
                  className="px-12 py-3 border-2 border-purple-500 text-purple-400 font-bold text-base rounded-lg hover:bg-purple-500 hover:text-black transition-all transform hover:scale-105 uppercase tracking-wider"
                >
                  🎮 Simulate Gameplay (Demo Mode)
                </button>
              </div>
            )}
          </div>

          {/* Transaction Status */}
          {isJoinConfirmed && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 text-center">
                <p className="text-green-400 font-semibold">✓ Successfully joined the game!</p>
                {joinHash && (
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${joinHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:text-cyan-300 underline mt-2 inline-block"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </div>
          )}

          {isStartConfirmed && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-purple-500/10 border border-purple-500/50 rounded-xl p-4 text-center">
                <p className="text-purple-400 font-semibold">✓ Game started successfully!</p>
                {startHash && (
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${startHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:text-cyan-300 underline mt-2 inline-block"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Lobby Section (only when game is PENDING and connected) */}
          {isConnected && gameStatus === 0 && players && (players as string[]).length > 0 && (
            <div className="mt-20">
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-cyan-400">Lobby</h3>
                  <span className="text-lg text-gray-400">
                    {(players as string[]).length}/10 Players
                  </span>
                </div>

                {/* Player Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const player = (players as string[])[index];
                    const isYou = player && address && player.toLowerCase() === address.toLowerCase();

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          player
                            ? isYou
                              ? 'bg-cyan-500/10 border-cyan-500/50'
                              : 'bg-gray-800/50 border-gray-700'
                            : 'bg-gray-900/30 border-gray-800 border-dashed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                player ? 'bg-green-500' : 'bg-gray-600'
                              }`}
                            />
                            <span className="font-mono text-sm">
                              {player ? (
                                <>
                                  {player.substring(0, 6)}...{player.substring(38)}
                                  {isYou && <span className="ml-2 text-cyan-400 font-bold">(You)</span>}
                                </>
                              ) : (
                                <span className="text-gray-500">Waiting...</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Start Game Button (Owner Only) */}
                {isOwner && (
                  <div className="pt-4 border-t border-cyan-500/20">
                    <button
                      onClick={handleStartGame}
                      disabled={!canStartGame || isStartLoading}
                      className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-wider"
                    >
                      {isStartLoading ? (
                        <span className="flex items-center justify-center gap-3">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isStartPending ? 'Confirm in Wallet...' : 'Starting Game...'}
                        </span>
                      ) : (
                        `Start Game ${(players as string[]).length < 10 ? `(${10 - (players as string[]).length} more needed)` : ''}`
                      )}
                    </button>
                    {isOwner && (players as string[]).length < 10 && (
                      <p className="text-center text-sm text-gray-400 mt-2">
                        Owner Controls: Start the game when 10 players have joined
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulation Mode - Active Game Grid */}
          {simulationMode && simulationGameState === 'active' && (
            <GameGrid
              players={mockPlayers}
              currentPlayer={mockCurrentPlayer}
              prizePool={mockPrizePool}
              simulationMode={true}
              simulationEliminatedPlayers={simulationEliminatedPlayers}
              onSimulationElimination={handleSimulationElimination}
              onEndSimulation={endSimulationGame}
              onExitSimulation={exitSimulation}
            />
          )}

          {/* Simulation Mode - Results Page */}
          {simulationMode && simulationGameState === 'finished' && (
            <Results
              players={mockPlayers}
              currentPlayer={mockCurrentPlayer}
              prizePool={mockPrizePool}
              simulationMode={true}
              simulationEliminatedPlayers={simulationEliminatedPlayers}
              onExitSimulation={exitSimulation}
            />
          )}

          {/* Active Game Grid (when game is ACTIVE and player has joined) */}
          {!simulationMode && isConnected && gameStatus === 1 && hasJoined && players && (
            <GameGrid
              players={players as string[]}
              currentPlayer={address!}
              prizePool={prizePool as bigint}
            />
          )}

          {/* Results Page (when game is FINISHED and player has joined) */}
          {!simulationMode && isConnected && gameStatus === 2 && hasJoined && players && (
            <Results
              players={players as string[]}
              currentPlayer={address!}
              prizePool={prizePool as bigint}
            />
          )}

          {/* Game Info Section (only when connected and NOT in active game or results) */}
          {isConnected && ((gameStatus !== 1 && gameStatus !== 2) || !hasJoined) && (
            <div className="mt-20 space-y-6">
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-cyan-400 mb-6">Game Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Status</div>
                    <div className="text-xl font-bold text-white">
                      {gameStatus === 0 ? 'Pending' : gameStatus === 1 ? 'Active' : 'Finished'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Players</div>
                    <div className="text-xl font-bold text-white">
                      {players ? `${(players as string[]).length}/10` : '0/10'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Prize Pool</div>
                    <div className="text-xl font-bold text-white">
                      {prizePool ? formatEther(prizePool as bigint) : '0'} ETH
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Your Status</div>
                    <div className="text-xl font-bold text-white">
                      {hasJoined ? '✓ Joined' : 'Not Joined'}
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Play */}
              <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">How to Play</h3>
                <div className="space-y-3 text-gray-300">
                  <p>• Deposit 0.001 ETH to join the game (10 players required)</p>
                  <p>• Roles are secretly assigned via iExec TEE: 2 Sentinels, 8 Echoes</p>
                  <p>• Sentinels can scan to eliminate Echoes</p>
                  <p>• Survive and make strategic moves to win your share of the prize pool</p>
                  <p>• Winners split 95% of the pool equally</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-12 text-gray-500 text-sm">
          <p>Built on Arbitrum Sepolia · Powered by iExec TEE</p>
          <p className="mt-2">
            Contract: <span className="font-mono text-cyan-400">{GRIDFALL_CONTRACT_ADDRESS}</span>
          </p>
        </footer>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-cyan-400">How to Play Gridfall</h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-cyan-400 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 text-gray-300">
              {/* Game Overview */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Game Overview</h3>
                <p>Gridfall is a decentralized battle royale game where players must scan each other to survive. Only the smartest and most strategic players will claim their share of the prize pool.</p>
              </div>

              {/* How to Join */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">How to Join</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Connect your wallet to the game</li>
                  <li>Deposit 0.001 ETH to join the lobby</li>
                  <li>Wait for 10 players to join</li>
                  <li>The game owner will start the game</li>
                </ol>
              </div>

              {/* Roles */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Roles (Secret Assignment)</h3>
                <p className="mb-2">Roles are secretly assigned via iExec Trusted Execution Environment (TEE):</p>
                <ul className="space-y-2 ml-2">
                  <li><span className="text-red-400 font-bold">2 Sentinels</span> - Can eliminate Echoes by scanning them</li>
                  <li><span className="text-green-400 font-bold">8 Echoes</span> - Must avoid being scanned by Sentinels</li>
                </ul>
                <p className="mt-2 text-yellow-400 text-sm">⚠️ You won't know your role until you make your first scan!</p>
              </div>

              {/* Gameplay */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Gameplay</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Once the game starts, you'll see a 2x5 grid of all 10 players</li>
                  <li>Click on any player's card (except your own) to scan them</li>
                  <li>Confirm your scan in the modal that appears</li>
                  <li>Your role will be revealed after your first scan</li>
                  <li>If you're a Sentinel and scan an Echo, they are eliminated</li>
                  <li>If you're an Echo or a Sentinel scanning another Sentinel, nothing happens</li>
                  <li>Continue scanning until the game ends</li>
                </ol>
                <p className="mt-2 text-yellow-400 text-sm">⚠️ You must make at least one move to be eligible for winning!</p>
              </div>

              {/* Winning */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">How to Win</h3>
                <ul className="space-y-2 ml-2">
                  <li>Survive until the game ends</li>
                  <li>Make at least one scan (required by smart contract)</li>
                  <li>Winners split 95% of the prize pool equally</li>
                  <li>5% goes to the contract owner as a fee</li>
                </ul>
              </div>

              {/* Strategy Tips */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Strategy Tips</h3>
                <ul className="space-y-2 ml-2">
                  <li>Don't reveal your role too early</li>
                  <li>Watch the elimination patterns to identify Sentinels</li>
                  <li>If you're a Sentinel, consider your timing carefully</li>
                  <li>If you're an Echo, try to blend in and avoid suspicious behavior</li>
                  <li>Remember: everyone must make at least one move!</li>
                </ul>
              </div>

              {/* Safe Exit */}
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Safe Exit</h3>
                <p>If you want to leave the game early, you can use the "Safe Exit" button. This will remove you from the game but you won't be eligible for prizes.</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all"
              >
                Got it! Let's Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
