'use client';

import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { GRIDFALL_CONTRACT_ADDRESS, GRIDFALL_ABI } from '@/lib/contract';

interface ResultsProps {
  players: string[];
  currentPlayer: string;
  prizePool: bigint;
  simulationMode?: boolean;
  simulationEliminatedPlayers?: string[];
  onExitSimulation?: () => void;
}

export default function Results({
  players,
  currentPlayer,
  prizePool,
  simulationMode = false,
  simulationEliminatedPlayers = [],
  onExitSimulation
}: ResultsProps) {
  const [isClaiming, setIsClaiming] = useState(false);

  // Read contract data (skip if simulation mode)
  const { data: winners, refetch: refetchWinners } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'getWinners',
    query: { enabled: !simulationMode }
  });

  const { data: eliminatedPlayers } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'getEliminatedPlayers',
    query: { enabled: !simulationMode }
  });

  const { data: isCurrentPlayerWinner } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'isWinner',
    args: [currentPlayer as `0x${string}`],
    query: { enabled: !simulationMode }
  });

  const { data: claimableAmount, refetch: refetchClaimable } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'claimableAmount',
    args: [currentPlayer as `0x${string}`],
    query: { enabled: !simulationMode }
  });

  const { data: hasClaimed, refetch: refetchHasClaimed } = useReadContract({
    address: GRIDFALL_CONTRACT_ADDRESS,
    abi: GRIDFALL_ABI,
    functionName: 'hasClaimed',
    args: [currentPlayer as `0x${string}`],
    query: { enabled: !simulationMode }
  });

  // Simulation data
  const simulationWinners = simulationMode
    ? players.filter(p => !simulationEliminatedPlayers.includes(p))
    : [];
  const simulationIsWinner = simulationMode && simulationWinners.includes(currentPlayer);
  const simulationClaimableAmount = simulationMode && simulationIsWinner
    ? prizePool / BigInt(simulationWinners.length > 0 ? simulationWinners.length : 1)
    : BigInt(0);

  // Write contract hook
  const { data: claimHash, writeContract: claimWrite, isPending: isClaimPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Handle claim prize
  const handleClaimPrize = () => {
    if (isClaiming) return;

    setIsClaiming(true);
    try {
      claimWrite({
        address: GRIDFALL_CONTRACT_ADDRESS,
        abi: GRIDFALL_ABI,
        functionName: 'claimPrize',
      });
    } catch (error) {
      console.error('Error claiming prize:', error);
      setIsClaiming(false);
    }
  };

  // Reset claiming state after confirmation
  if (isClaimConfirmed && isClaiming) {
    setIsClaiming(false);
    refetchClaimable();
    refetchHasClaimed();
    refetchWinners();
  }

  const isClaimLoading = isClaimPending || isClaimConfirming;

  // Use simulation or real data
  const actualWinners = simulationMode ? simulationWinners : (winners as string[] || []);
  const actualEliminatedPlayers = simulationMode ? simulationEliminatedPlayers : (eliminatedPlayers as string[] || []);
  const actualIsWinner = simulationMode ? simulationIsWinner : (isCurrentPlayerWinner === true);
  const actualClaimableAmount = simulationMode ? simulationClaimableAmount : (claimableAmount as bigint || BigInt(0));

  const winnerCount = actualWinners.length;
  const eliminatedCount = actualEliminatedPlayers.length;
  const survivorCount = players.length - eliminatedCount;

  // Check if current player is a winner
  const isWinner = actualIsWinner;
  const canClaim = simulationMode ? false : (isWinner && actualClaimableAmount > BigInt(0) && !hasClaimed);

  return (
    <div className="mt-20">
      {/* Game Over Header */}
      <div className="text-center mb-12">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1"></div>
          <h1 className="text-6xl font-black text-gradient">
            {simulationMode ? '🎮 DEMO RESULTS' : 'GAME OVER'}
          </h1>
          {simulationMode && onExitSimulation && (
            <div className="flex-1 flex justify-end">
              <button
                onClick={onExitSimulation}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm"
              >
                Exit Simulation
              </button>
            </div>
          )}
          {!simulationMode && <div className="flex-1"></div>}
        </div>
        <p className="text-xl text-gray-400">
          {simulationMode ? 'Simulation complete. See how you performed!' : 'The grid has fallen. Winners emerge.'}
        </p>
      </div>

      {/* Winner/Loser Banner for Current Player */}
      {isWinner ? (
        <div className="bg-gradient-to-r from-green-950/50 to-cyan-950/50 border-2 border-green-500 rounded-2xl p-8 mb-12 text-center">
          <div className="text-5xl font-black text-green-400 mb-4">🎉 VICTORY! 🎉</div>
          <div className="text-2xl text-white mb-2">You survived the Gridfall!</div>
          <div className="text-gray-400">
            Congratulations! You are one of the {winnerCount} survivor{winnerCount !== 1 ? 's' : ''}.
          </div>
        </div>
      ) : (
        <div className="bg-red-950/20 border border-red-500/50 rounded-xl p-6 mb-12 text-center">
          <div className="text-3xl font-bold text-red-400 mb-2">You did not survive</div>
          <div className="text-gray-400">
            Better luck next time. Train harder, strategize better.
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Winners Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
          <div className="relative bg-black border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-6xl font-black text-green-400 mb-2">{winnerCount}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">
              Winner{winnerCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Survivors Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
          <div className="relative bg-black border border-cyan-500/30 rounded-2xl p-8 text-center">
            <div className="text-6xl font-black text-cyan-400 mb-2">{survivorCount}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Survived</div>
          </div>
        </div>

        {/* Eliminated Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-300 blur"></div>
          <div className="relative bg-black border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="text-6xl font-black text-red-400 mb-2">{eliminatedCount}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Eliminated</div>
          </div>
        </div>
      </div>

      {/* Prize Pool & Claim Section */}
      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-8 mb-12">
        <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Prize Pool</h2>

        <div className="text-center mb-8">
          <div className="text-6xl font-black text-gradient mb-2">
            {formatEther(prizePool)} ETH
          </div>
          <div className="text-gray-400">
            Total prize pool distributed to {winnerCount} winner{winnerCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Claim Prize Section (only for winners) */}
        {isWinner && (
          <div className="bg-black/50 border border-green-500/30 rounded-xl p-6">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-400 mb-2">Your Prize</div>
              <div className="text-4xl font-bold text-green-400">
                {formatEther(actualClaimableAmount)} ETH
              </div>
            </div>

            {simulationMode ? (
              <div className="text-center text-gray-400">
                💡 In real game mode, you would claim this prize!
              </div>
            ) : hasClaimed ? (
              <div className="text-center">
                <div className="inline-block px-6 py-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <span className="text-green-400 font-bold">✓ Prize Claimed!</span>
                </div>
              </div>
            ) : canClaim ? (
              <button
                onClick={handleClaimPrize}
                disabled={isClaimLoading}
                className="w-full px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isClaimLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isClaimPending ? 'Confirm in Wallet...' : 'Claiming Prize...'}
                  </span>
                ) : (
                  `Claim ${formatEther(actualClaimableAmount)} ETH`
                )}
              </button>
            ) : (
              <div className="text-center text-gray-400">
                No prize to claim
              </div>
            )}
          </div>
        )}
      </div>

      {/* Winners List */}
      <div className="bg-black/50 border border-green-500/30 rounded-2xl p-8 mb-12">
        <h3 className="text-2xl font-bold text-green-400 mb-6 text-center">
          🏆 Winners ({winnerCount})
        </h3>

        {actualWinners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actualWinners.map((winner, index) => {
              const isYou = winner.toLowerCase() === currentPlayer.toLowerCase();

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isYou
                      ? 'bg-cyan-500/10 border-cyan-500/70'
                      : 'bg-gray-800/50 border-green-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="font-mono text-sm">
                          {winner.substring(0, 6)}...{winner.substring(38)}
                        </div>
                        {isYou && <span className="text-cyan-400 font-bold text-xs">YOU</span>}
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">
                      {isYou ? formatEther(actualClaimableAmount) : '—'} ETH
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400">No winners found</div>
        )}
      </div>

      {/* Eliminated Players List */}
      <div className="bg-black/50 border border-red-500/30 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-red-400 mb-6 text-center">
          💀 Eliminated ({eliminatedCount})
        </h3>

        {actualEliminatedPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actualEliminatedPlayers.map((player, index) => {
              const isYou = player.toLowerCase() === currentPlayer.toLowerCase();

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg bg-red-950/20 border border-red-500/30 ${
                    isYou ? 'border-cyan-500/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">💀</div>
                    <div className="font-mono text-sm text-gray-400">
                      {player.substring(0, 6)}...{player.substring(38)}
                      {isYou && <span className="ml-2 text-cyan-400 font-bold">(You)</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400">No eliminations</div>
        )}
      </div>

      {/* Transaction Success Message */}
      {isClaimConfirmed && (
        <div className="fixed bottom-8 right-8 bg-green-500/10 border border-green-500/50 rounded-xl p-4 max-w-sm z-50">
          <p className="text-green-400 font-semibold">✓ Prize claimed successfully!</p>
          {claimHash && (
            <a
              href={`https://sepolia.arbiscan.io/tx/${claimHash}`}
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
