'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { GRIDFALL_CONTRACT_ADDRESS, GRIDFALL_ABI } from '@/lib/contract';

interface GameGridProps {
  players: string[];
  currentPlayer: string;
  prizePool: bigint;
  simulationMode?: boolean;
  simulationEliminatedPlayers?: string[];
  onSimulationElimination?: (playerAddress: string) => void;
  onEndSimulation?: () => void;
  onExitSimulation?: () => void;
}

export default function GameGrid({
  players,
  currentPlayer,
  prizePool,
  simulationMode = false,
  simulationEliminatedPlayers = [],
  onSimulationElimination,
  onEndSimulation,
  onExitSimulation
}: GameGridProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [hasSeenRole, setHasSeenRole] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [simulationRole, setSimulationRole] = useState<'SENTINEL' | 'ECHO' | null>(null);

  // Read contract data (skip if simulation mode)
  const { data: eliminatedPlayers, refetch: refetchEliminated } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'getEliminatedPlayers',
    query: { enabled: !simulationMode }
  });

  const { data: playersRemaining, refetch: refetchRemaining } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'getPlayersRemaining',
    query: { enabled: !simulationMode }
  });

  const { data: isCurrentPlayerEliminated, refetch: refetchIsEliminated } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'isEliminated',
    args: [currentPlayer as `0x${string}`],
    query: { enabled: !simulationMode }
  });

  const { data: refundPercent } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'SAFE_EXIT_REFUND_PERCENT',
    query: { enabled: !simulationMode }
  });

  const { data: depositAmount } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'DEPOSIT_AMOUNT',
    query: { enabled: !simulationMode }
  });

  // Write contract hooks
  const { data: pingHash, writeContract: pingWrite, isPending: isPingPending } = useWriteContract();
  const { data: exitHash, writeContract: exitWrite, isPending: isExitPending } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isPingConfirming, isSuccess: isPingConfirmed } = useWaitForTransactionReceipt({
    hash: pingHash,
  });
  const { isLoading: isExitConfirming, isSuccess: isExitConfirmed } = useWaitForTransactionReceipt({
    hash: exitHash,
  });

  // Handle player card click
  const handlePlayerClick = (playerAddress: string) => {
    if (playerAddress === currentPlayer) return; // Can't scan yourself
    if (isPlayerEliminated(playerAddress)) return; // Can't scan eliminated players
    if (currentPlayerEliminated) return; // Can't scan if you're eliminated

    setSelectedTarget(playerAddress);
  };

  // Handle scan confirmation
  const handleConfirmScan = () => {
    if (!selectedTarget || isPinging) return;

    // Show role reveal if this is the first scan
    if (!hasSeenRole) {
      setShowRoleReveal(true);
      setHasSeenRole(true);

      // Assign random role for simulation (80% Echo, 20% Sentinel)
      if (simulationMode && !simulationRole) {
        setSimulationRole(Math.random() > 0.8 ? 'SENTINEL' : 'ECHO');
      }

      // Don't execute ping yet, wait for role reveal acknowledgment
      return;
    }

    // Execute ping transaction or simulation
    if (simulationMode) {
      executeSimulationPing();
    } else {
      executePing();
    }
  };

  // Execute ping after role reveal
  const handleRoleRevealAcknowledged = () => {
    setShowRoleReveal(false);
    if (simulationMode) {
      executeSimulationPing();
    } else {
      executePing();
    }
  };

  // Execute simulation ping (mock elimination)
  const executeSimulationPing = () => {
    if (!selectedTarget) return;

    // If you're a Sentinel, eliminate the target (simulated)
    if (simulationRole === 'SENTINEL' && onSimulationElimination) {
      setTimeout(() => {
        onSimulationElimination(selectedTarget);
        setSelectedTarget(null);
        // Trigger other players to make moves after this one
        simulateOtherPlayersMoves();
      }, 500);
    } else {
      // Echo pings have no effect
      setSelectedTarget(null);
      // Still trigger other players to make moves
      simulateOtherPlayersMoves();
    }
  };

  // Simulate other players making moves (for demo)
  const simulateOtherPlayersMoves = () => {
    if (!simulationMode || !onSimulationElimination) return;

    // Get all non-eliminated players except current player
    const activePlayers = players.filter(
      p => !isPlayerEliminated(p) && p !== currentPlayer
    );

    // Simulate 2-3 random players making moves
    const numMovesToSimulate = Math.min(Math.floor(Math.random() * 2) + 2, activePlayers.length);

    for (let i = 0; i < numMovesToSimulate; i++) {
      setTimeout(() => {
        // Pick a random active player as the "scanner"
        const scanner = activePlayers[Math.floor(Math.random() * activePlayers.length)];

        // Pick a random target (different from scanner)
        const possibleTargets = activePlayers.filter(p => p !== scanner && !isPlayerEliminated(p));
        if (possibleTargets.length === 0) return;

        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        // 20% chance this scanner is a Sentinel and eliminates the target
        if (Math.random() < 0.2) {
          onSimulationElimination(target);
        }
        // Otherwise, it's an Echo or Sentinel that didn't eliminate (no effect)
      }, 1000 + i * 800); // Stagger the moves
    }
  };

  // Execute ping transaction
  const executePing = () => {
    if (!selectedTarget) return;

    setIsPinging(true);
    try {
      pingWrite({
        address: GRIDFALL_CONTRACT_ADDRESS,
        abi: GRIDFALL_ABI,
        functionName: 'ping',
        args: [selectedTarget as `0x${string}`],
      });
    } catch (error) {
      console.error('Error pinging:', error);
      setIsPinging(false);
      setSelectedTarget(null);
    }
  };

  // Handle safe exit
  const handleSafeExit = () => {
    if (isExiting) return;

    setIsExiting(true);
    try {
      exitWrite({
        address: GRIDFALL_CONTRACT_ADDRESS,
        abi: GRIDFALL_ABI,
        functionName: 'safeExit',
      });
    } catch (error) {
      console.error('Error exiting:', error);
      setIsExiting(false);
    }
  };

  // Reset states after ping confirmation
  if (isPingConfirmed && isPinging) {
    setIsPinging(false);
    setSelectedTarget(null);
    refetchEliminated();
    refetchRemaining();
    refetchIsEliminated();
  }

  // Reset states after exit confirmation
  if (isExitConfirmed && isExiting) {
    setIsExiting(false);
    setShowExitConfirm(false);
  }

  // Check if player is eliminated
  const isPlayerEliminated = (playerAddress: string) => {
    if (simulationMode) {
      return simulationEliminatedPlayers.some(
        (addr) => addr.toLowerCase() === playerAddress.toLowerCase()
      );
    }
    if (!eliminatedPlayers) return false;
    return (eliminatedPlayers as string[]).some(
      (addr) => addr.toLowerCase() === playerAddress.toLowerCase()
    );
  };

  // Get current players remaining and eliminated count
  const actualPlayersRemaining = simulationMode
    ? players.length - simulationEliminatedPlayers.length
    : playersRemaining !== undefined ? Number(playersRemaining) : 10;

  const eliminatedCount = simulationMode
    ? simulationEliminatedPlayers.length
    : eliminatedPlayers ? (eliminatedPlayers as string[]).length : 0;

  // Check if current player is eliminated
  const currentPlayerEliminated = simulationMode
    ? isPlayerEliminated(currentPlayer)
    : isCurrentPlayerEliminated;

  // Calculate refund amount
  const refundAmount = depositAmount && refundPercent
    ? (depositAmount as bigint * BigInt(Number(refundPercent))) / BigInt(100)
    : BigInt(0);

  const isPingLoading = isPingPending || isPingConfirming;
  const isExitLoading = isExitPending || isExitConfirming;

  return (
    <div className="mt-20">
      {/* Game Stats Header */}
      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">
            {simulationMode ? '🎮 DEMO MODE' : 'ACTIVE GAME'}
          </h2>
          {simulationMode && onExitSimulation && (
            <button
              onClick={onExitSimulation}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm"
            >
              Exit Simulation
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-400 mb-2">Players Remaining</div>
            <div className="text-3xl font-bold text-green-400">
              {actualPlayersRemaining}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Eliminated</div>
            <div className="text-3xl font-bold text-red-400">{eliminatedCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Prize Pool</div>
            <div className="text-3xl font-bold text-cyan-400">
              {formatEther(prizePool)} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Your Status */}
      {currentPlayerEliminated ? (
        <div className="bg-red-950/20 border border-red-500/50 rounded-xl p-6 mb-8 text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">You have been eliminated!</div>
          <div className="text-gray-400">Better luck next time, survivor.</div>
        </div>
      ) : (
        <div className="bg-green-950/20 border border-green-500/50 rounded-xl p-6 mb-8 text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">You are still in the game!</div>
          <div className="text-gray-400">
            {hasSeenRole
              ? "Click on a player's card to scan them"
              : "Click on any player to make your first move and reveal your role"}
          </div>
        </div>
      )}

      {/* Player Grid - 2x5 Layout */}
      <div className="bg-black/50 border border-cyan-500/30 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-cyan-400 mb-6 text-center">PLAYER GRID</h3>
        <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
          {players.map((player, index) => {
            const isYou = player.toLowerCase() === currentPlayer.toLowerCase();
            const isEliminated = isPlayerEliminated(player);
            const isClickable = !isYou && !isEliminated && !isCurrentPlayerEliminated;

            return (
              <div
                key={index}
                onClick={() => isClickable && handlePlayerClick(player)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${isYou
                    ? 'bg-cyan-500/10 border-cyan-500/70'
                    : isEliminated
                    ? 'bg-red-950/20 border-red-500/30 opacity-50'
                    : 'bg-gray-800/50 border-gray-600 hover:border-cyan-500 hover:bg-cyan-500/5'
                  }
                  ${isClickable ? 'cursor-pointer transform hover:scale-105' : 'cursor-not-allowed'}
                `}
              >
                {/* Player Number */}
                <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">
                  #{index + 1}
                </div>

                {/* Status Indicator */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  isEliminated ? 'bg-red-500' : 'bg-green-500'
                }`} />

                {/* Player Address */}
                <div className="text-center mt-4">
                  <div className="font-mono text-sm mb-2">
                    {player.substring(0, 6)}...{player.substring(38)}
                  </div>

                  {isYou && (
                    <div className="text-cyan-400 font-bold text-lg">YOU</div>
                  )}

                  {isEliminated && (
                    <div className="text-red-400 font-bold text-sm mt-2">ELIMINATED</div>
                  )}

                  {!isYou && !isEliminated && isClickable && (
                    <div className="text-gray-400 text-xs mt-2">Click to scan</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Exit / End Game Buttons */}
      {!currentPlayerEliminated && (
        <div className="flex justify-center gap-4 mb-8">
          {!simulationMode && (
            <button
              onClick={() => setShowExitConfirm(true)}
              disabled={isExitLoading}
              className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isExitLoading ? 'Exiting...' : `Safe Exit (Refund ${formatEther(refundAmount)} ETH)`}
            </button>
          )}
          {simulationMode && onEndSimulation && (
            <button
              onClick={onEndSimulation}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 uppercase tracking-wider"
            >
              End Game & View Results
            </button>
          )}
        </div>
      )}

      {/* Scan Confirmation Modal */}
      {selectedTarget && !showRoleReveal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Confirm Scan</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to scan this player?
            </p>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-400 mb-1">Target:</div>
              <div className="font-mono text-white">
                {selectedTarget.substring(0, 6)}...{selectedTarget.substring(38)}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleConfirmScan}
                disabled={isPingLoading}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {isPingLoading ? 'Scanning...' : 'Yes, I am sure'}
              </button>
              <button
                onClick={() => setSelectedTarget(null)}
                disabled={isPingLoading}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Not right now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Reveal Modal */}
      {showRoleReveal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-3xl font-bold text-purple-400 mb-4 text-center">ROLE REVEALED</h3>
            <div className="bg-purple-950/50 border border-purple-500/50 rounded-xl p-6 mb-6 text-center">
              <div className="text-5xl font-black text-purple-400 mb-2">
                {simulationMode ? simulationRole : (Math.random() > 0.8 ? 'SENTINEL' : 'ECHO')}
              </div>
              <div className="text-gray-400 text-sm">
                {(simulationMode ? simulationRole : (Math.random() > 0.8 ? 'SENTINEL' : 'ECHO')) === 'SENTINEL'
                  ? 'You can eliminate Echoes by scanning them'
                  : 'Survive and avoid being scanned by Sentinels'}
              </div>
            </div>
            <button
              onClick={handleRoleRevealAcknowledged}
              className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg transition-all"
            >
              Understood - Proceed with Scan
            </button>
          </div>
        </div>
      )}

      {/* Safe Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-8 max-w-md mx-4">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Confirm Safe Exit</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to exit the game? You will receive a 50% refund.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-400 mb-1">Refund Amount:</div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatEther(refundAmount)} ETH
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSafeExit}
                disabled={isExitLoading}
                className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {isExitLoading ? 'Exiting...' : 'Yes, Exit Game'}
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                disabled={isExitLoading}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Success Messages */}
      {isPingConfirmed && (
        <div className="fixed bottom-8 right-8 bg-green-500/10 border border-green-500/50 rounded-xl p-4 max-w-sm z-50">
          <p className="text-green-400 font-semibold">✓ Scan completed!</p>
          {pingHash && (
            <a
              href={`https://sepolia.arbiscan.io/tx/${pingHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              View transaction
            </a>
          )}
        </div>
      )}

      {isExitConfirmed && (
        <div className="fixed bottom-8 right-8 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 max-w-sm z-50">
          <p className="text-yellow-400 font-semibold">✓ Successfully exited!</p>
          {exitHash && (
            <a
              href={`https://sepolia.arbiscan.io/tx/${exitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              View transaction
            </a>
          )}
        </div>
      )}
    </div>
  );
}
