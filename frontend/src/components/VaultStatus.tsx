"use client";

import { useState, useEffect, useCallback } from "react";
import { useStarknet } from "@/context/StarknetContext";
import { RpcProvider, Contract } from "starknet";
import { SILENT_WILL_ADDRESS, SILENT_WILL_ABI, MOCK_BTC_ADDRESS, MOCK_BTC_ABI } from "@/lib/contracts";

interface VaultData {
  exists: boolean;
  heirCommitment: string;
  btcAmount: string;
  lastProof: number;
  inactivityPeriod: number;
  claimed: boolean;
  timeRemaining: number;
  btcBalance: string;
}

export default function VaultStatus() {
  const { address, connected } = useStarknet();
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVault = useCallback(async () => {
    if (!address) return;
    setLoading(true);

    try {
      const provider = new RpcProvider({
        nodeUrl: "https://rpc.starknet-testnet.lava.build",
      });

      const swContract = new Contract(
        SILENT_WILL_ABI as unknown as any[],
        SILENT_WILL_ADDRESS,
        provider
      );

      const btcContract = new Contract(
        MOCK_BTC_ABI as unknown as any[],
        MOCK_BTC_ADDRESS,
        provider,
      );

      const [info, balance] = await Promise.all([
        swContract.call("get_vault_info", [address]),
        btcContract.call("balance_of", [address]),
      ]);

      const result = info as any;
      // Vault info returns a tuple: (heir_commitment, btc_amount, last_proof, inactivity_period, claimed)
      const heirCommitment = result[0]?.toString() ?? "0";
      const btcAmount = result[1]?.toString() ?? "0";
      const lastProof = Number(result[2] ?? 0);
      const inactivityPeriod = Number(result[3] ?? 0);
      const claimed = Boolean(result[4]);

      const exists = heirCommitment !== "0" || btcAmount !== "0";

      const now = Math.floor(Date.now() / 1000);
      const deadline = lastProof + inactivityPeriod;
      const remaining = Math.max(0, deadline - now);

      setVault({
        exists,
        heirCommitment,
        btcAmount: (Number(btcAmount) / 1e8).toFixed(8),
        lastProof,
        inactivityPeriod,
        claimed,
        timeRemaining: remaining,
        btcBalance: (Number(balance?.toString() ?? "0") / 1e8).toFixed(8),
      });
    } catch {
      setVault(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (connected && address) fetchVault();
  }, [connected, address, fetchVault]);

  // Countdown timer
  useEffect(() => {
    if (!vault || !vault.exists || vault.claimed) return;
    const interval = setInterval(() => {
      setVault((prev) => {
        if (!prev) return prev;
        return { ...prev, timeRemaining: Math.max(0, prev.timeRemaining - 1) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [vault?.exists, vault?.claimed]);

  if (!connected) return null;

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const statusColor = vault
    ? vault.claimed
      ? "red"
      : vault.timeRemaining === 0
      ? "yellow"
      : "green"
    : "zinc";

  return (
    <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-700 rounded-2xl p-6 space-y-4 transition-all duration-300 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">📊</span> Vault Status
        </h2>
        <button
          onClick={fetchVault}
          disabled={loading}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {vault === null && !loading && (
        <p className="text-zinc-500 text-sm">
          Connect wallet & click refresh to view vault status.
        </p>
      )}

      {vault && !vault.exists && (
        <div className="bg-zinc-800/80 rounded-lg p-4">
          <p className="text-zinc-400">No vault found for your address.</p>
          <p className="text-sm text-zinc-500 mt-1">
            Wallet mBTC Balance: {vault.btcBalance} mBTC
          </p>
        </div>
      )}

      {vault && vault.exists && (
        <div className="space-y-3">
          {/* Live status indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                statusColor === "green" ? "bg-green-400" : statusColor === "yellow" ? "bg-yellow-400" : "bg-red-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                statusColor === "green" ? "bg-green-500" : statusColor === "yellow" ? "bg-yellow-500" : "bg-red-500"
              }`} />
            </span>
            <span className="text-xs text-zinc-400">
              {vault.claimed ? "Vault Claimed" : vault.timeRemaining === 0 ? "Vault Claimable" : "Vault Active"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/80 rounded-lg p-3 transition-all duration-200 hover:bg-zinc-800">
              <p className="text-xs text-zinc-500">Locked BTC</p>
              <p className="text-lg font-bold text-amber-400">
                {vault.btcAmount} mBTC
              </p>
            </div>
            <div className="bg-zinc-800/80 rounded-lg p-3 transition-all duration-200 hover:bg-zinc-800">
              <p className="text-xs text-zinc-500">Wallet Balance</p>
              <p className="text-lg font-bold text-zinc-300">
                {vault.btcBalance} mBTC
              </p>
            </div>
          </div>

          <div className="bg-zinc-800/80 rounded-lg p-3 transition-all duration-200 hover:bg-zinc-800">
            <p className="text-xs text-zinc-500">Time Until Claimable</p>
            {vault.claimed ? (
              <p className="text-lg font-bold text-red-400">CLAIMED</p>
            ) : vault.timeRemaining === 0 ? (
              <p className="text-lg font-bold text-red-400 animate-pulse">
                CLAIMABLE NOW
              </p>
            ) : (
              <p className="text-lg font-bold text-green-400">
                {formatTime(vault.timeRemaining)}
              </p>
            )}
          </div>

          <div className="bg-zinc-800/80 rounded-lg p-3 transition-all duration-200 hover:bg-zinc-800">
            <p className="text-xs text-zinc-500">Heir Commitment</p>
            <p className="text-xs font-mono text-zinc-400 break-all">
              {vault.heirCommitment}
            </p>
          </div>

          <div className="flex gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                vault.claimed
                  ? "bg-red-400/10 text-red-400"
                  : vault.timeRemaining === 0
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "bg-green-400/10 text-green-400"
              }`}
            >
              {vault.claimed
                ? "Claimed"
                : vault.timeRemaining === 0
                ? "Unlocked"
                : "Active"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-400">
              {vault.inactivityPeriod >= 86400
                ? `Period: ${Math.floor(vault.inactivityPeriod / 86400)}d`
                : vault.inactivityPeriod >= 3600
                ? `Period: ${Math.floor(vault.inactivityPeriod / 3600)}h`
                : vault.inactivityPeriod >= 60
                ? `Period: ${Math.floor(vault.inactivityPeriod / 60)}m`
                : `Period: ${vault.inactivityPeriod}s`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
