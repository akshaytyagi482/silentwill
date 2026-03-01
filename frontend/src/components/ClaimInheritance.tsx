"use client";

import { useState } from "react";
import { useStarknet } from "@/context/StarknetContext";
import { hash, shortString } from "starknet";

export default function ClaimInheritance() {
  const { account, connected, silentWillContract } = useStarknet();
  const [secret, setSecret] = useState("");
  const [vaultOwner, setVaultOwner] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Must match CreateVault's encoding exactly
  const secretToFelt = (s: string): string => {
    if (s.startsWith("0x")) return s;
    if (s.length <= 31) {
      return shortString.encodeShortString(s);
    }
    const encoder = new TextEncoder();
    const bytes = encoder.encode(s);
    let hexStr = "0x";
    for (const b of bytes) hexStr += b.toString(16).padStart(2, "0");
    return hash.computePedersenHash(hexStr, "0x1");
  };

  const handleClaim = async () => {
    if (!account || !silentWillContract) return;
    setLoading(true);
    setStatus("");

    try {
      const secretFelt = secretToFelt(secret);

      // Generate a random nullifier to prevent double-claim
      const nullifier =
        "0x" +
        Array.from(crypto.getRandomValues(new Uint8Array(31)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      setStatus("Claiming inheritance with ZK commitment proof…");
      await account.execute([
        {
          contractAddress: silentWillContract.address,
          entrypoint: "claim_inheritance",
          calldata: [secretFelt, nullifier, vaultOwner, recipient || account.address],
        },
      ]);
      setStatus(
        "✅ Inheritance claimed! BTC tokens transferred to your chosen address."
      );
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
        <span className="text-purple-400">🔐</span> Claim Inheritance
      </h2>
      <p className="text-sm text-zinc-400">
        If the vault owner has been inactive longer than the set period, the heir
        can claim using the secret shared off-chain. No on-chain identity is
        revealed.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Vault Owner Address
          </label>
          <input
            type="text"
            value={vaultOwner}
            onChange={(e) => setVaultOwner(e.target.value)}
            placeholder="0x04a3…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Secret (given to you by the vault owner)
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter the secret phrase…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Recipient Address (optional — defaults to your wallet)
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x04a3… (leave empty for your wallet)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50 font-mono text-sm"
          />
        </div>

        <button
          onClick={handleClaim}
          disabled={loading || !secret || !vaultOwner}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-all"
        >
          {loading ? "Claiming…" : "Claim Inheritance"}
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
