"use client";

import { useStarknet } from "@/context/StarknetContext";

export default function ConnectButton() {
  const { connected, connecting, address, connectWallet, disconnectWallet } =
    useStarknet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-semibold px-5 py-2 rounded-lg transition-all"
    >
      {connecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
