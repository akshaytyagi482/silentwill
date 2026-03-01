"use client";

import { useState } from "react";
import { useStarknet } from "@/context/StarknetContext";

export default function ProveLife() {
  const { account, connected, silentWillContract } = useStarknet();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProveLife = async () => {
    if (!account || !silentWillContract) return;
    setLoading(true);
    setStatus("");

    try {
      setStatus("Submitting proof of life…");
      await account.execute([
        {
          contractAddress: silentWillContract.address,
          entrypoint: "prove_life",
          calldata: [],
        },
      ]);
      setStatus("✅ Proof of life submitted! Your vault timer has been reset.");
    } catch (err: unknown) {
      setStatus(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="text-green-400">💚</span> Proof of Life
      </h2>
      <p className="text-sm text-zinc-400">
        Call this periodically to prove you are still active. Resets the
        inactivity timer on your vault.
      </p>
      <button
        onClick={handleProveLife}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-all"
      >
        {loading ? "Submitting…" : "I'm Alive — Reset Timer"}
      </button>
      {status && (
        <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg p-3">
          {status}
        </p>
      )}
    </div>
  );
}
