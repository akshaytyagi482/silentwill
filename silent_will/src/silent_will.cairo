// ============================================================================
// SilentWill Protocol — Private Bitcoin Inheritance on Starknet
// ============================================================================
// Uses Pedersen commitment-based privacy model leveraging Starknet Pedersen
// hashing primitives. No on-chain link between owner and heir.
// ============================================================================

use starknet::ContractAddress;

#[starknet::interface]
pub trait ISilentWill<TContractState> {
    /// Create a new inheritance vault.
    /// - `heir_commitment`: PedersenHash(secret) — only the heir knows the secret
    /// - `inactivity_period`: seconds of inactivity before inheritance unlocks
    /// - `btc_amount`: amount of mock BTC tokens to lock
    fn create_vault(
        ref self: TContractState,
        heir_commitment: felt252,
        inactivity_period: u64,
        btc_amount: u256,
    );

    /// Owner calls periodically to prove they are alive.
    fn prove_life(ref self: TContractState);

    /// Heir claims inheritance by revealing the secret.
    /// - `secret`: the pre-image such that PedersenHash(secret, 0) == heir_commitment
    /// - `nullifier`: unique value to prevent double-claim
    /// - `vault_owner`: address of the vault owner
    /// - `recipient`: address to receive the BTC tokens
    fn claim_inheritance(
        ref self: TContractState,
        secret: felt252,
        nullifier: felt252,
        vault_owner: ContractAddress,
        recipient: ContractAddress,
    );

    // ── View functions ──────────────────────────────────────────────────

    fn get_vault_info(
        self: @TContractState, owner: ContractAddress,
    ) -> (felt252, u256, u64, u64, bool);

    fn get_btc_token(self: @TContractState) -> ContractAddress;

    fn is_nullifier_used(self: @TContractState, nullifier: felt252) -> bool;

    fn get_time_remaining(self: @TContractState, owner: ContractAddress) -> u64;
}

#[starknet::contract]
pub mod SilentWill {
    use core::pedersen::pedersen;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    // ── Storage ─────────────────────────────────────────────────────────

    #[storage]
    struct Storage {
        // Vault data stored per-field to keep it simple & Scarb-friendly
        vault_heir_commitment: Map<ContractAddress, felt252>,
        vault_btc_amount: Map<ContractAddress, u256>,
        vault_last_proof: Map<ContractAddress, u64>,
        vault_inactivity_period: Map<ContractAddress, u64>,
        vault_claimed: Map<ContractAddress, bool>,
        vault_exists: Map<ContractAddress, bool>,
        // Nullifier set — prevents double-claim
        used_nullifiers: Map<felt252, bool>,
        // Address of the mock BTC ERC-20 token
        btc_token: ContractAddress,
    }

    // ── Events ──────────────────────────────────────────────────────────

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        VaultCreated: VaultCreated,
        ProofOfLife: ProofOfLife,
        InheritanceClaimed: InheritanceClaimed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VaultCreated {
        #[key]
        pub owner: ContractAddress,
        pub btc_amount: u256,
        pub inactivity_period: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProofOfLife {
        #[key]
        pub owner: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InheritanceClaimed {
        #[key]
        pub vault_owner: ContractAddress,
        pub amount: u256,
        // NOTE: recipient is NOT emitted — privacy preserved
    }

    // ── Errors ──────────────────────────────────────────────────────────

    pub mod Errors {
        pub const VAULT_ALREADY_EXISTS: felt252 = 'Vault already exists';
        pub const VAULT_NOT_FOUND: felt252 = 'Vault does not exist';
        pub const ZERO_AMOUNT: felt252 = 'Amount must be > 0';
        pub const ZERO_PERIOD: felt252 = 'Inactivity period must be > 0';
        pub const NOT_VAULT_OWNER: felt252 = 'Caller is not vault owner';
        pub const VAULT_ALREADY_CLAIMED: felt252 = 'Vault already claimed';
        pub const OWNER_STILL_ACTIVE: felt252 = 'Owner is still active';
        pub const INVALID_SECRET: felt252 = 'Invalid secret';
        pub const NULLIFIER_USED: felt252 = 'Nullifier already used';
    }

    // ── ERC-20 interface for BTC token transfers ────────────────────────

    #[starknet::interface]
    trait IERC20<TContractState> {
        fn transfer_from(
            ref self: TContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool;
        fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    }

    // ── Constructor ─────────────────────────────────────────────────────

    #[constructor]
    fn constructor(ref self: ContractState, btc_token_address: ContractAddress) {
        self.btc_token.write(btc_token_address);
    }

    // ── External functions ──────────────────────────────────────────────

    #[abi(embed_v0)]
    impl SilentWillImpl of super::ISilentWill<ContractState> {
        // ────────────────────────────────────────────────────────────────
        // create_vault
        // ────────────────────────────────────────────────────────────────
        fn create_vault(
            ref self: ContractState,
            heir_commitment: felt252,
            inactivity_period: u64,
            btc_amount: u256,
        ) {
            let caller = get_caller_address();

            // Guards
            assert(!self.vault_exists.read(caller), Errors::VAULT_ALREADY_EXISTS);
            assert(btc_amount > 0, Errors::ZERO_AMOUNT);
            assert(inactivity_period > 0, Errors::ZERO_PERIOD);

            // Transfer BTC tokens from caller → this contract
            let btc_addr = self.btc_token.read();
            let btc = IERC20Dispatcher { contract_address: btc_addr };
            let this = starknet::get_contract_address();
            btc.transfer_from(caller, this, btc_amount);

            // Write vault
            let now = get_block_timestamp();
            self.vault_exists.write(caller, true);
            self.vault_heir_commitment.write(caller, heir_commitment);
            self.vault_btc_amount.write(caller, btc_amount);
            self.vault_last_proof.write(caller, now);
            self.vault_inactivity_period.write(caller, inactivity_period);
            self.vault_claimed.write(caller, false);

            self.emit(VaultCreated { owner: caller, btc_amount, inactivity_period });
        }

        // ────────────────────────────────────────────────────────────────
        // prove_life — owner heartbeat
        // ────────────────────────────────────────────────────────────────
        fn prove_life(ref self: ContractState) {
            let caller = get_caller_address();
            assert(self.vault_exists.read(caller), Errors::VAULT_NOT_FOUND);
            assert(!self.vault_claimed.read(caller), Errors::VAULT_ALREADY_CLAIMED);

            let now = get_block_timestamp();
            self.vault_last_proof.write(caller, now);

            self.emit(ProofOfLife { owner: caller, timestamp: now });
        }

        // ────────────────────────────────────────────────────────────────
        // claim_inheritance — heir reveals secret
        // ────────────────────────────────────────────────────────────────
        fn claim_inheritance(
            ref self: ContractState,
            secret: felt252,
            nullifier: felt252,
            vault_owner: ContractAddress,
            recipient: ContractAddress,
        ) {
            // Vault must exist & not already claimed
            assert(self.vault_exists.read(vault_owner), Errors::VAULT_NOT_FOUND);
            assert(!self.vault_claimed.read(vault_owner), Errors::VAULT_ALREADY_CLAIMED);

            // Nullifier must be fresh
            assert(!self.used_nullifiers.read(nullifier), Errors::NULLIFIER_USED);

            // Inactivity check
            let now = get_block_timestamp();
            let last_proof = self.vault_last_proof.read(vault_owner);
            let inactivity = self.vault_inactivity_period.read(vault_owner);
            assert(now >= last_proof + inactivity, Errors::OWNER_STILL_ACTIVE);

            // ZK-light: verify Pedersen commitment
            // heir_commitment == pedersen(secret, 0)
            let computed = pedersen(secret, 0);
            let stored = self.vault_heir_commitment.read(vault_owner);
            assert(computed == stored, Errors::INVALID_SECRET);

            // Mark claimed & burn nullifier
            self.vault_claimed.write(vault_owner, true);
            self.used_nullifiers.write(nullifier, true);

            // Transfer BTC tokens → recipient (privately chosen address)
            let amount = self.vault_btc_amount.read(vault_owner);
            let btc_addr = self.btc_token.read();
            let btc = IERC20Dispatcher { contract_address: btc_addr };
            btc.transfer(recipient, amount);

            self.emit(InheritanceClaimed { vault_owner, amount });
        }

        // ── View helpers ────────────────────────────────────────────────

        fn get_vault_info(
            self: @ContractState, owner: ContractAddress,
        ) -> (felt252, u256, u64, u64, bool) {
            (
                self.vault_heir_commitment.read(owner),
                self.vault_btc_amount.read(owner),
                self.vault_last_proof.read(owner),
                self.vault_inactivity_period.read(owner),
                self.vault_claimed.read(owner),
            )
        }

        fn get_btc_token(self: @ContractState) -> ContractAddress {
            self.btc_token.read()
        }

        fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool {
            self.used_nullifiers.read(nullifier)
        }

        fn get_time_remaining(self: @ContractState, owner: ContractAddress) -> u64 {
            let last = self.vault_last_proof.read(owner);
            let period = self.vault_inactivity_period.read(owner);
            let now = get_block_timestamp();
            let deadline = last + period;
            if now >= deadline {
                0
            } else {
                deadline - now
            }
        }
    }
}
