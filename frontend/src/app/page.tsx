"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConnectButton from "@/components/ConnectButton";
import CreateVault from "@/components/CreateVault";
import ProveLife from "@/components/ProveLife";
import ClaimInheritance from "@/components/ClaimInheritance";
import VaultStatus from "@/components/VaultStatus";
import { useStarknet } from "@/context/StarknetContext";

type Tab = "create" | "prove" | "claim";

export default function Home() {
  const { connected } = useStarknet();
  const [tab, setTab] = useState<Tab>("create");

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* Header */}
      <header className="border-b border-zinc-800/80 backdrop-blur-md bg-black/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-amber-500/20">
              SW
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                SilentWill Protocol
              </h1>
              <p className="text-xs text-zinc-500">
                Private Bitcoin Inheritance on Starknet
              </p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero */}
      {!connected && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto px-6 py-24 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Powered by Starknet &middot; Pedersen Commitments
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl font-bold text-white mb-4 leading-tight"
          >
            Your Bitcoin <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              Never Dies With You
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto mb-8"
          >
            Lock BTC in a time-locked vault. If you go silent, your heir claims
            privately using a secret — no public identity, no trust required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-12"
          >
            {[
              { icon: "\u{1F512}", title: "Lock", desc: "Deposit BTC with a Pedersen commitment" },
              { icon: "\u{1F493}", title: "Heartbeat", desc: "Prove life periodically to keep vault locked" },
              { icon: "\u{1F510}", title: "Inherit", desc: "Heir claims privately with zero-knowledge proof" },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-700 rounded-xl p-4 transition-all duration-300 hover:scale-[1.03] hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex justify-center gap-8 mt-14"
          >
            {[
              { value: "$140B+", label: "Lost BTC Globally" },
              { value: "100%", label: "On-Chain & Trustless" },
              { value: "Zero", label: "Identity Exposure" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <h3 className="text-xl font-bold text-white text-center mb-8">How It Works</h3>
            <div className="space-y-4">
              {[
                { step: "01", title: "Create a Vault", desc: "Lock your BTC and set a secret phrase. The contract stores only a Pedersen hash — your heir's identity stays hidden." },
                { step: "02", title: "Prove You're Alive", desc: "Periodically call prove_life() to reset the inactivity timer. As long as you're active, funds stay locked." },
                { step: "03", title: "Heir Claims Privately", desc: "If you go silent past the threshold, your heir reveals the secret to unlock funds — sent to any address they choose." },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                  className="flex gap-4 items-start bg-zinc-900/70 backdrop-blur-xl border border-zinc-700 rounded-xl p-4 transition-all duration-300 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <span className="text-2xl font-bold text-amber-500/30 select-none">{item.step}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="mt-16 max-w-lg mx-auto"
          >
            <h3 className="text-xl font-bold text-white text-center mb-6">Built With</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {["Cairo 2.16", "Starknet", "Pedersen Hash", "Next.js", "TypeScript", "Tailwind CSS", "starknet.js v6", "Framer Motion"].map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 transition-all duration-200 hover:border-amber-400/50 hover:text-amber-400"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.6 }}
            className="mt-16 mb-8 text-center"
          >
            <p className="text-zinc-500 text-sm">Connect your wallet above to get started</p>
          </motion.div>
        </motion.section>
      )}

      {/* Dashboard */}
      {connected && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto px-6 py-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab switcher */}
              <div className="flex gap-1 bg-zinc-900/70 backdrop-blur-xl p-1 rounded-xl border border-zinc-800">
                {([
                  { key: "create" as Tab, label: "Create Vault", icon: "\u{1F512}" },
                  { key: "prove" as Tab, label: "Prove Life", icon: "\u{1F493}" },
                  { key: "claim" as Tab, label: "Claim", icon: "\u{1F510}" },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden ${
                      tab === t.key
                        ? "text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === t.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-zinc-800 rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Active panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab === "create" && <CreateVault />}
                  {tab === "prove" && <ProveLife />}
                  {tab === "claim" && <ClaimInheritance />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right column: Status */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-6"
            >
              <VaultStatus />

              {/* Info card */}
              <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-700 rounded-2xl p-6 space-y-3 transition-all duration-300 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/5">
                <h3 className="text-sm font-semibold text-white">
                  How Privacy Works
                </h3>
                <ul className="text-xs text-zinc-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>
                      Heir identity is stored as a{" "}
                      <strong className="text-zinc-300">
                        Pedersen hash commitment
                      </strong>{" "}
                      — no address on-chain.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>
                      Secret is shared{" "}
                      <strong className="text-zinc-300">off-chain</strong>{" "}
                      between owner and heir.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>
                      A{" "}
                      <strong className="text-zinc-300">
                        nullifier prevents double-claims
                      </strong>
                      .
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>
                      Heir chooses{" "}
                      <strong className="text-zinc-300">
                        any recipient address
                      </strong>{" "}
                      at claim time — untraceable.
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 mt-12 backdrop-blur-md bg-black/40">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <p>SilentWill Protocol &copy; 2026</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/akshaytyagi482"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              akshaytyagi482
            </a>
            <span className="text-zinc-700">|</span>
            <p>Built on Starknet Sepolia &middot; Pedersen Commitments</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
