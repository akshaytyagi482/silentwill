"use client";

import { useState } from "react";
import { useStarknet } from "@/context/StarknetContext";
import { hash, shortString } from "starknet";
import { SILENT_WILL_ADDRESS } from "@/lib/contracts";

export default function CreateVault() {
  const { account, connected, silentWillContract, mockBtcContract } =
    useStarknet();
  const [secret, setSecret] = useState("");
  const [amount, setAmount] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState<"seconds" | "minutes" | "hours" | "days">("seconds");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitment, setCommitment] = useState("");

  const unitMultiplier = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };

  // Encode a text secret into a felt252 hex string
  const secretToFelt = (s: string): string => {
    // If it's already a hex string, use it directly
    if (s.startsWith("0x")) return s;
    // For short strings (<=31 chars), use Cairo short string encoding
    if (s.length <= 31) {
      return shortString.encodeShortString(s);
    }
    // For longer strings, hash the UTF-8 bytes to get a single felt
    const encoder = new TextEncoder();
    const bytes = encoder.encode(s);
    let hexStr = "0x";
    for (const b of bytes) hexStr += b.toString(16).padStart(2, "0");
    // Use Pedersen to compress to a single felt
    return hash.computePedersenHash(hexStr, "0x1");
  };

  const computeCommitment = (s: string) => {
    if (!s) return "";
    const secretFelt = secretToFelt(s);
    const c = hash.computePedersenHash(secretFelt, "0");
    return c;
  };

  const handleSecretChange = (val: string) => {
    setSecret(val);
    if (val) {
      setCommitment(computeCommitment(val));
    } else {
      setCommitment("");
    }
  };

  const handleCreate = async () => {
    if (!account || !silentWillContract || !mockBtcContract) return;
    setLoading(true);
    setStatus("");

    try {
      const heirCommitment = computeCommitment(secret);
      const inactivityPeriod = BigInt(parseInt(timeValue) * unitMultiplier[timeUnit]); // time → seconds
      const btcAmount = BigInt(Math.floor(parseFloat(amount) * 1e8)); // 8 decimals

      setStatus("Step 1/3: Minting test mBTC + Approving + Creating vault…");
      // Batch all 3 calls into a single multicall for better UX
      await account.execute([
        {
          contractAddress: mockBtcContract.address,
          entrypoint: "mint",
          calldata: [account.address, btcAmount.toString(), "0"],
        },
        {
          contractAddress: mockBtcContract.address,
          entrypoint: "approve",
          calldata: [SILENT_WILL_ADDRESS, btcAmount.toString(), "0"],
        },
        {
          contractAddress: silentWillContract.address,
          entrypoint: "create_vault",
          calldata: [heirCommitment, inactivityPeriod.toString(), btcAmount.toString(), "0"],
        },
      ]);

      setStatus("✅ Vault created! Share the secret with your heir privately.");
    } catch (err: unknown) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="text-amber-400">🔒</span> Create Inheritance Vault
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Heir Secret (share privately with your heir)
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => handleSecretChange(e.target.value)}
            placeholder="Enter a secret phrase…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          {commitment && (
            <p className="mt-1.5 text-xs text-zinc-500 font-mono break-all">
              Commitment: {commitment.slice(0, 20)}…{commitment.slice(-8)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              BTC Amount
            </label>
            <input
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Inactivity Period
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                placeholder="120"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value as typeof timeUnit)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-sm"
              >
                <option value="seconds">sec</option>
                <option value="minutes">min</option>
                <option value="hours">hrs</option>
                <option value="days">days</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !secret || !amount || !timeValue}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold py-3 rounded-lg transition-all"
        >
          {loading ? "Processing…" : "Create Vault & Lock BTC"}
        </button>

        {status && (
          <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-3">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
