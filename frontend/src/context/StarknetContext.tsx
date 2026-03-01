"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Contract, RpcProvider, type AccountInterface } from "starknet";
import {
  SILENT_WILL_ADDRESS,
  MOCK_BTC_ADDRESS,
  SILENT_WILL_ABI,
  MOCK_BTC_ABI,
} from "@/lib/contracts";

// ── Types ───────────────────────────────────────────────────────────────

interface StarknetCtx {
  account: AccountInterface | null;
  address: string | null;
  connected: boolean;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  silentWillContract: Contract | null;
  mockBtcContract: Contract | null;
}

const StarknetContext = createContext<StarknetCtx>({
  account: null,
  address: null,
  connected: false,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  silentWillContract: null,
  mockBtcContract: null,
});

export const useStarknet = () => useContext(StarknetContext);

// ── Helpers to detect wallet extensions ─────────────────────────────────

function getStarknetWallets(): any[] {
  if (typeof window === "undefined") return [];
  const wallets: any[] = [];
  const win = window as any;
  // ArgentX injects window.starknet_argentX or window.starknet
  if (win.starknet_argentX) wallets.push(win.starknet_argentX);
  // Braavos injects window.starknet_braavos
  if (win.starknet_braavos) wallets.push(win.starknet_braavos);
  // Fallback: generic window.starknet
  if (wallets.length === 0 && win.starknet) wallets.push(win.starknet);
  return wallets;
}

// ── Provider ────────────────────────────────────────────────────────────

export function StarknetProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [silentWillContract, setSilentWillContract] =
    useState<Contract | null>(null);
  const [mockBtcContract, setMockBtcContract] = useState<Contract | null>(null);

  const setupContracts = useCallback((provider: any) => {
    const sw = new Contract(
      SILENT_WILL_ABI as unknown as any[],
      SILENT_WILL_ADDRESS,
      provider,
    );
    setSilentWillContract(sw);

    const btc = new Contract(
      MOCK_BTC_ABI as unknown as any[],
      MOCK_BTC_ADDRESS,
      provider,
    );
    setMockBtcContract(btc);
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const wallets = getStarknetWallets();

      if (wallets.length === 0) {
        alert(
          "No Starknet wallet detected!\n\nPlease install ArgentX or Braavos browser extension and refresh."
        );
        setConnecting(false);
        return;
      }

      // Use the first available wallet (ArgentX preferred)
      const wallet = wallets[0];

      // Request connection — this triggers the extension popup
      await wallet.enable({ starknetVersion: "v5" });

      if (wallet.isConnected && wallet.account) {
        const acc = wallet.account as unknown as AccountInterface;
        const addr: string =
          wallet.selectedAddress || wallet.account?.address || "";

        setAccount(acc);
        setAddress(addr);
        setupContracts(acc);
      }
    } catch (err) {
    } finally {
      setConnecting(false);
    }
  }, [setupContracts]);

  const disconnectWallet = useCallback(() => {
    const win = window as any;
    // Some wallets support disable
    try {
      win.starknet_argentX?.disable?.();
      win.starknet_braavos?.disable?.();
      win.starknet?.disable?.();
    } catch { /* ignore */ }
    setAccount(null);
    setAddress(null);
    setSilentWillContract(null);
    setMockBtcContract(null);
  }, []);

  return (
    <StarknetContext.Provider
      value={{
        account,
        address,
        connected: !!account,
        connecting,
        connectWallet,
        disconnectWallet,
        silentWillContract,
        mockBtcContract,
      }}
    >
      {children}
    </StarknetContext.Provider>
  );
}
