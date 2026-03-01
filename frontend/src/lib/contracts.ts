// SilentWill Protocol — Contract ABI & Addresses
// Update SILENT_WILL_ADDRESS and MOCK_BTC_ADDRESS after deployment

export const STARKNET_CHAIN_ID = "0x534e5f5345504f4c4941"; // SN_SEPOLIA

// ⚠️  Replace these after deploying to Sepolia
export const SILENT_WILL_ADDRESS =
  "0x02a71139a908ca30e2cd07cc40194e40e86504037161864ef18b79ea9dd40f23";
export const MOCK_BTC_ADDRESS =
  "0x0015eeba2f69ddc371c66885a7073734ec873c8b9dfba942ba3c19bbcea3d5c6";

// ── SilentWill ABI ──────────────────────────────────────────────────────
export const SILENT_WILL_ABI = [
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      { name: "btc_token_address", type: "core::starknet::contract_address::ContractAddress" },
    ],
  },
  {
    type: "function",
    name: "create_vault",
    inputs: [
      { name: "heir_commitment", type: "core::felt252" },
      { name: "inactivity_period", type: "core::integer::u64" },
      { name: "btc_amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "prove_life",
    inputs: [],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "claim_inheritance",
    inputs: [
      { name: "secret", type: "core::felt252" },
      { name: "nullifier", type: "core::felt252" },
      { name: "vault_owner", type: "core::starknet::contract_address::ContractAddress" },
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "get_vault_info",
    inputs: [
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [
      {
        type: "(core::felt252, core::integer::u256, core::integer::u64, core::integer::u64, core::bool)",
      },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_btc_token",
    inputs: [],
    outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "is_nullifier_used",
    inputs: [{ name: "nullifier", type: "core::felt252" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "get_time_remaining",
    inputs: [
      { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u64" }],
    state_mutability: "view",
  },
] as const;

// ── MockBTC ABI ─────────────────────────────────────────────────────────
export const MOCK_BTC_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "core::integer::u8" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "balance_of",
    inputs: [
      { name: "account", type: "core::starknet::contract_address::ContractAddress" },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
] as const;
