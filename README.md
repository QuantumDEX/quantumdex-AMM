# QuantumDEX — Smart Contracts

Solidity implementation of QuantumDEX - a decentralized exchange (AMM) and token streaming platform for Ethereum-compatible chains. Built with Hardhat and following OpenZeppelin security best practices. Primary deployment target: Base and Base Sepolia testnet.

## Overview

QuantumDEX consists of two main protocol contracts:

### Automated Market Maker (AMM) DEX
- **Permissionless pool creation** for any ERC20 token pair
- **Liquidity provision** with automatic fee distribution
- **Token swaps** using the constant product formula (x * y = k)
- **Deterministic pool IDs** for efficient routing

### Token Streaming Protocol
- **Continuous payment streams** between sender and recipient
- **Time-based token distribution** with configurable payment per block
- **Flexible withdrawal** of accumulated tokens
- **Stream parameter updates** with dual-party consent via signatures

## Features

- ✅ Constant Product Market Maker (CPMM) formula
- ✅ Configurable swap fees (basis points)
- ✅ Minimum liquidity lock to prevent pool drainage attacks
- ✅ Reentrancy protection
- ✅ Comprehensive test coverage (51 tests passing)
- ✅ Gas-optimized storage layout
- ✅ Custom errors for gas-efficient reverts
- ✅ Native ETH support (WETH pattern)
- ✅ Multi-hop swaps
- ✅ Flash loans

## Tech Stack

- **Solidity:** ^0.8.20
- **Framework:** Hardhat
- **Testing:** Hardhat, Ethers.js v6, Chai
- **Security:** OpenZeppelin Contracts
- **Gas Reporting:** hardhat-gas-reporter

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## Project Structure

```
contracts/
├── AMM.sol          # Main AMM contract (DEX)
├── TokenStreaming.sol  # Token streaming protocol contract
└── MockToken.sol    # ERC20 token for testing

tests/
├── AMM.test.ts      # AMM test suite
└── TokenStreaming.test.ts  # Token streaming test suite

scripts/
└── deploy.ts        # Deployment scripts
```

## Contract Functions

### AMM (DEX) Operations

- `createPool(tokenA, tokenB, amountA, amountB, feeBps)` - Create a new pool with initial liquidity (supports native ETH)
- `addLiquidity(poolId, amount0, amount1)` - Add liquidity to an existing pool (supports native ETH)
- `removeLiquidity(poolId, liquidity)` - Remove liquidity and receive tokens (supports native ETH)
- `swap(poolId, tokenIn, amountIn, minAmountOut, recipient)` - Execute a token swap (supports native ETH)
- `swapMultiHop(path, poolIds, amountIn, minAmountOut, recipient)` - Execute multi-hop swaps through multiple pools
- `flashLoan(poolId, token, amount, data)` - Borrow tokens for flash loan operations

### AMM View Functions

- `getPool(poolId)` - Get pool information (reserves, fee, etc.)
- `getLpBalance(poolId, account)` - Get user's LP token balance
- `getPoolId(tokenA, tokenB, feeBps)` - Calculate deterministic pool ID

### Token Streaming Operations

- `createStream(recipient, token, initialBalance, timeframe, paymentPerBlock)` - Create a new payment stream
- `refuel(streamId, amount)` - Add more tokens to an existing stream
- `withdraw(streamId)` - Withdraw accumulated tokens (recipient only)
- `refund(streamId)` - Withdraw excess tokens after stream ends (sender only)
- `updateStreamDetails(streamId, paymentPerBlock, timeframe, signature)` - Update stream parameters with consent

### Token Streaming View Functions

- `getStream(streamId)` - Get stream information
- `getWithdrawableBalance(streamId, account)` - Get withdrawable balance for an account
- `hashStream(streamId, newPaymentPerBlock, newTimeframe)` - Get hash for signature verification

## Testing

The test suite covers:
- Pool creation and initial liquidity
- Adding and removing liquidity
- Token swaps with fee calculations
- Constant product formula verification
- Native ETH support (create pool, add/remove liquidity, swaps)
- Multi-hop swaps
- Flash loans
- Edge cases and error handling
- Gas optimizations (custom errors, unchecked blocks)

**Test Results:** 51 tests passing

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/AMM.test.ts
```

## Deployment

```bash
# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy.ts --network baseSepolia

# Deploy to Base (mainnet)
npx hardhat run scripts/deploy.ts --network base
```

**Primary deployment targets:** Base Sepolia (testnet) and Base (mainnet)

## Contributing

We welcome contributions! To get started:

1. **Pick an issue** from [`ISSUES.md`](./ISSUES.md)
2. **Create a branch** using the issue number: `issue/<number>-short-description`
3. **Implement your changes** following the issue's acceptance criteria
4. **Submit a PR** with the issue number in the title/description

When pushing your changes, include the issue number or title in your commit messages.

## Security

This codebase has been reviewed for common vulnerabilities, but **has not undergone a professional security audit**. Use at your own risk.

### Security Features

- **Minimum Liquidity Lock**: On pool creation, 1000 liquidity tokens are permanently locked to address(0). This prevents pool drainage attacks where the last liquidity provider could drain the entire pool, leaving it unusable.

- **Reentrancy Protection**: All state-changing functions are protected with `nonReentrant` modifier to prevent reentrancy attacks.

- **Access Control**: Owner-only functions use OpenZeppelin's `Ownable` pattern for secure access control.

- **Gas Optimization**: Contract uses custom errors instead of require strings, unchecked blocks for validated arithmetic, and optimal storage packing (uint112 reserves with uint16 feeBps).

### Minimum Liquidity Lock Implementation

The minimum liquidity lock is implemented by:
1. Requiring `sqrt(amount0 * amount1) > MINIMUM_LIQUIDITY` on pool creation
2. Locking `MINIMUM_LIQUIDITY` (1000) tokens to `address(0)` forever
3. User receives `sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY` tokens
4. Preventing removal of liquidity that would leave pool below `MINIMUM_LIQUIDITY`

This ensures pools can never be completely drained, maintaining protocol stability.

## License

See the main project LICENSE file.
