# Event Documentation - QuantumDEX AMM

This document provides a comprehensive reference for all events emitted by the QuantumDEX AMM smart contract. These events are optimized for off-chain indexing and efficient frontend querying.

## Table of Contents
- [Event Overview](#event-overview)
- [Event Specifications](#event-specifications)
- [Indexing Strategy](#indexing-strategy)
- [Frontend Query Examples](#frontend-query-examples)
- [Gas Cost Considerations](#gas-cost-considerations)

---

## Event Overview

The AMM contract emits 7 types of events to track all state changes and user interactions:

| Event | Purpose | Frequency |
|-------|---------|-----------|
| `PoolCreated` | New pool initialization | Once per pool |
| `PoolUpdated` | Reserve/supply changes | After every state change |
| `PriceUpdate` | Price tracking | After every swap |
| `LiquidityAdded` | Liquidity provision | Per add liquidity tx |
| `LiquidityRemoved` | Liquidity withdrawal | Per remove liquidity tx |
| `Swap` | Token swaps | Per swap (including multi-hop) |
| `MultiHopSwap` | Multi-hop swap summary | Once per multi-hop tx |
| `FlashLoan` | Flash loan execution | Per flash loan tx |

---

## Event Specifications

### 1. PoolCreated

Emitted when a new liquidity pool is created.

```solidity
event PoolCreated(
    bytes32 indexed poolId,
    address indexed token0,
    address indexed token1,
    uint16 feeBps,
    uint256 initialLiquidity,
    uint256 amount0,
    uint256 amount1,
    address provider
);
```

**Indexed Parameters:**
- `poolId` - Unique pool identifier (enables filtering by specific pool)
- `token0` - First token address (enables filtering by token)
- `token1` - Second token address (enables filtering by token)

**Non-Indexed Parameters:**
- `feeBps` - Pool fee in basis points (e.g., 30 = 0.30%)
- `initialLiquidity` - Total liquidity minted (including locked portion)
- `amount0` - Amount of token0 deposited
- `amount1` - Amount of token1 deposited
- `provider` - Address that created the pool

**Use Cases:**
- Track all pools for a specific token
- Monitor new pool creation
- Build pool registry for frontend
- Calculate initial pool ratios

---

### 2. PoolUpdated

Emitted after every state change that affects pool reserves or total supply.

```solidity
event PoolUpdated(
    bytes32 indexed poolId,
    address indexed token0,
    address indexed token1,
    uint112 reserve0,
    uint112 reserve1,
    uint256 totalSupply
);
```

**Indexed Parameters:**
- `poolId` - Unique pool identifier
- `token0` - First token address
- `token1` - Second token address

**Non-Indexed Parameters:**
- `reserve0` - Current reserve of token0
- `reserve1` - Current reserve of token1
- `totalSupply` - Current total LP token supply

**Use Cases:**
- Track real-time pool state
- Calculate current exchange rates
- Monitor liquidity depth
- Detect significant reserve changes

**Emission Frequency:**
- After `createPool()`
- After `addLiquidity()`
- After `removeLiquidity()`
- After `swap()`
- After `flashLoan()`
- After each hop in `swapMultiHop()`

---

### 3. PriceUpdate

Emitted after swaps to track price changes efficiently.

```solidity
event PriceUpdate(
    bytes32 indexed poolId,
    address indexed token0,
    address indexed token1,
    uint256 price,
    uint112 reserve0,
    uint112 reserve1,
    uint256 timestamp
);
```

**Indexed Parameters:**
- `poolId` - Unique pool identifier
- `token0` - First token address
- `token1` - Second token address

**Non-Indexed Parameters:**
- `price` - Current price (reserve1/reserve0 * 1e18 for precision)
- `reserve0` - Current reserve of token0
- `reserve1` - Current reserve of token1
- `timestamp` - Block timestamp of the price update

**Use Cases:**
- Build price charts and historical data
- Track price movements over time
- Calculate price impact of swaps
- Monitor arbitrage opportunities
- Display current exchange rates

**Price Calculation:**
```javascript
// Price represents how many token1 units per token0
// Multiply by 1e18 for precision
price = (reserve1 * 1e18) / reserve0

// To get human-readable price:
humanPrice = price / 1e18
```

---

### 4. LiquidityAdded

Emitted when liquidity is added to a pool.

```solidity
event LiquidityAdded(
    bytes32 indexed poolId,
    address indexed provider,
    uint256 liquidityMinted,
    uint256 amount0,
    uint256 amount1
);
```

**Indexed Parameters:**
- `poolId` - Unique pool identifier
- `provider` - Address that added liquidity

**Non-Indexed Parameters:**
- `liquidityMinted` - Amount of LP tokens minted
- `amount0` - Amount of token0 deposited
- `amount1` - Amount of token1 deposited

**Use Cases:**
- Track user liquidity positions
- Calculate user's share of pool
- Monitor liquidity provision activity
- Build liquidity provider leaderboards

---

### 5. LiquidityRemoved

Emitted when liquidity is removed from a pool.

```solidity
event LiquidityRemoved(
    bytes32 indexed poolId,
    address indexed provider,
    uint256 liquidityBurned,
    uint256 amount0,
    uint256 amount1
);
```

**Indexed Parameters:**
- `poolId` - Unique pool identifier
- `provider` - Address that removed liquidity

**Non-Indexed Parameters:**
- `liquidityBurned` - Amount of LP tokens burned
- `amount0` - Amount of token0 withdrawn
- `amount1` - Amount of token1 withdrawn

**Use Cases:**
- Track liquidity withdrawals
- Monitor pool liquidity trends
- Calculate impermanent loss
- Alert on large liquidity removals

---

### 6. Swap

Emitted for each token swap (including individual hops in multi-hop swaps).

```solidity
event Swap(
    bytes32 indexed poolId,
    address indexed sender,
    address indexed recipient,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 amountOut
);
```

**Indexed Parameters:**
- `poolId` - Pool used for the swap
- `sender` - Address that initiated the swap
- `recipient` - Address that received the output tokens

**Non-Indexed Parameters:**
- `tokenIn` - Token being sold
- `tokenOut` - Token being bought
- `amountIn` - Amount of tokenIn swapped
- `amountOut` - Amount of tokenOut received

**Use Cases:**
- Track trading volume
- Monitor user trading activity
- Calculate fees generated
- Build transaction history
- Filter swaps by recipient (e.g., router contracts)

---

### 7. MultiHopSwap

Emitted once per multi-hop swap transaction (summary event).

```solidity
event MultiHopSwap(
    address indexed sender,
    address indexed tokenIn,
    address indexed tokenOut,
    address[] path,
    bytes32[] poolIds,
    uint256 amountIn,
    uint256 amountOut,
    address recipient
);
```

**Indexed Parameters:**
- `sender` - Address that initiated the swap
- `tokenIn` - Initial input token
- `tokenOut` - Final output token

**Non-Indexed Parameters:**
- `path` - Array of token addresses in the swap path
- `poolIds` - Array of pool IDs used
- `amountIn` - Initial input amount
- `amountOut` - Final output amount
- `recipient` - Address that received final tokens

**Use Cases:**
- Track complex routing
- Analyze multi-hop swap patterns
- Calculate total price impact
- Monitor routing efficiency

**Note:** Individual `Swap` events are also emitted for each hop.

---

### 8. FlashLoan

Emitted when a flash loan is executed.

```solidity
event FlashLoan(
    bytes32 indexed poolId,
    address indexed token,
    address indexed borrower,
    uint256 amount,
    uint256 fee
);
```

**Indexed Parameters:**
- `poolId` - Pool used for flash loan
- `token` - Token borrowed
- `borrower` - Address that borrowed tokens

**Non-Indexed Parameters:**
- `amount` - Amount borrowed
- `fee` - Fee paid (9 bps = 0.09%)

**Use Cases:**
- Track flash loan usage
- Monitor flash loan fees collected
- Analyze arbitrage activity
- Calculate protocol revenue

---

## Indexing Strategy

### Why Index Parameters?

Indexed parameters (up to 3 per event) enable efficient filtering and searching:

✅ **Indexed:**
- Can filter events by this parameter
- Stored in log topics (faster queries)
- Costs ~375 gas more per indexed parameter

❌ **Non-Indexed:**
- Cannot filter directly (must fetch all events and filter client-side)
- Stored in log data (slower queries)
- Lower gas cost

### Our Indexing Choices

| Event | Indexed | Rationale |
|-------|---------|-----------|
| All Events | `poolId` | Filter by specific pool |
| Pool Events | `token0`, `token1` | Filter by token pair |
| User Events | `sender`/`provider`/`borrower` | Filter by user |
| Swap | `recipient` | Filter by recipient (e.g., router) |

### Gas Cost Impact

Approximate gas costs for indexed vs non-indexed parameters:

- **Indexed parameter:** ~375 gas per parameter
- **Non-indexed parameter:** ~68 gas per 32 bytes

**Example:** A `Swap` event with 3 indexed parameters costs ~1,125 gas more than with 0 indexed parameters, but enables much faster queries.

---

## Frontend Query Examples

### Using ethers.js v6

#### 1. Get all swaps for a specific pool

```javascript
const poolId = "0x1234...";
const filter = contract.filters.Swap(poolId);
const events = await contract.queryFilter(filter, fromBlock, toBlock);

events.forEach(event => {
  console.log(`Swap: ${event.args.amountIn} ${event.args.tokenIn} -> ${event.args.amountOut} ${event.args.tokenOut}`);
});
```

#### 2. Get all pools containing a specific token

```javascript
const tokenAddress = "0xABCD...";

// Token as token0
const filter1 = contract.filters.PoolCreated(null, tokenAddress, null);
// Token as token1
const filter2 = contract.filters.PoolCreated(null, null, tokenAddress);

const events1 = await contract.queryFilter(filter1);
const events2 = await contract.queryFilter(filter2);
const allPools = [...events1, ...events2];
```

#### 3. Track user's liquidity positions

```javascript
const userAddress = "0x5678...";

// Get all liquidity additions
const addFilter = contract.filters.LiquidityAdded(null, userAddress);
const addEvents = await contract.queryFilter(addFilter);

// Get all liquidity removals
const removeFilter = contract.filters.LiquidityRemoved(null, userAddress);
const removeEvents = await contract.queryFilter(removeFilter);
```

#### 4. Monitor price changes for a pool

```javascript
const poolId = "0x1234...";
const filter = contract.filters.PriceUpdate(poolId);

// Listen for real-time updates
contract.on(filter, (poolId, token0, token1, price, reserve0, reserve1, timestamp) => {
  const humanPrice = Number(price) / 1e18;
  console.log(`Price updated: ${humanPrice} token1 per token0`);
  console.log(`Reserves: ${reserve0} / ${reserve1}`);
  console.log(`Timestamp: ${new Date(Number(timestamp) * 1000)}`);
});
```

#### 5. Calculate 24h trading volume

```javascript
const poolId = "0x1234...";
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;

// Get block numbers for time range
const currentBlock = await provider.getBlockNumber();
const oneDayAgoBlock = await getBlockByTimestamp(oneDayAgo);

const filter = contract.filters.Swap(poolId);
const swaps = await contract.queryFilter(filter, oneDayAgoBlock, currentBlock);

let totalVolume = 0n;
swaps.forEach(swap => {
  totalVolume += swap.args.amountIn;
});

console.log(`24h Volume: ${totalVolume}`);
```

#### 6. Get current pool state

```javascript
const poolId = "0x1234...";
const filter = contract.filters.PoolUpdated(poolId);
const events = await contract.queryFilter(filter);

// Get most recent update
const latestUpdate = events[events.length - 1];
console.log(`Reserve0: ${latestUpdate.args.reserve0}`);
console.log(`Reserve1: ${latestUpdate.args.reserve1}`);
console.log(`Total Supply: ${latestUpdate.args.totalSupply}`);
```

### Using viem

#### 1. Watch for new swaps

```javascript
import { parseAbiItem } from 'viem';

const unwatch = publicClient.watchEvent({
  address: contractAddress,
  event: parseAbiItem('event Swap(bytes32 indexed poolId, address indexed sender, address indexed recipient, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)'),
  args: {
    poolId: '0x1234...'
  },
  onLogs: logs => {
    logs.forEach(log => {
      console.log('New swap:', log.args);
    });
  }
});
```

#### 2. Get historical price data

```javascript
const logs = await publicClient.getLogs({
  address: contractAddress,
  event: parseAbiItem('event PriceUpdate(bytes32 indexed poolId, address indexed token0, address indexed token1, uint256 price, uint112 reserve0, uint112 reserve1, uint256 timestamp)'),
  args: {
    poolId: '0x1234...'
  },
  fromBlock: 1000000n,
  toBlock: 'latest'
});

const priceHistory = logs.map(log => ({
  price: Number(log.args.price) / 1e18,
  timestamp: Number(log.args.timestamp),
  reserve0: log.args.reserve0,
  reserve1: log.args.reserve1
}));
```

---

## Gas Cost Considerations

### Event Emission Costs

Approximate gas costs for emitting events:

| Event | Indexed Params | Approx Gas Cost |
|-------|----------------|-----------------|
| `PoolCreated` | 3 | ~3,500 gas |
| `PoolUpdated` | 3 | ~2,800 gas |
| `PriceUpdate` | 3 | ~3,200 gas |
| `LiquidityAdded` | 2 | ~2,500 gas |
| `LiquidityRemoved` | 2 | ~2,500 gas |
| `Swap` | 3 | ~3,000 gas |
| `MultiHopSwap` | 3 | ~4,500 gas |
| `FlashLoan` | 3 | ~2,800 gas |

### Optimization Trade-offs

**More Indexed Parameters:**
- ✅ Faster queries
- ✅ Better filtering capabilities
- ✅ Improved UX (faster frontend)
- ❌ Higher gas costs (~375 gas per indexed param)

**Fewer Indexed Parameters:**
- ✅ Lower gas costs
- ❌ Slower queries (must filter client-side)
- ❌ More complex frontend code
- ❌ Worse UX for users

**Our Approach:**
We index the most commonly queried parameters (poolId, tokens, users) to optimize for frontend performance while keeping gas costs reasonable.

---

## Best Practices for Frontend Integration

### 1. Use Event Caching

Cache events locally to reduce RPC calls:

```javascript
// Cache events in localStorage or IndexedDB
const cacheKey = `events_${poolId}_${fromBlock}_${toBlock}`;
let events = localStorage.getItem(cacheKey);

if (!events) {
  events = await contract.queryFilter(filter, fromBlock, toBlock);
  localStorage.setItem(cacheKey, JSON.stringify(events));
} else {
  events = JSON.parse(events);
}
```

### 2. Use Block Ranges

Query events in chunks to avoid timeouts:

```javascript
const CHUNK_SIZE = 10000; // blocks per query
const events = [];

for (let i = fromBlock; i <= toBlock; i += CHUNK_SIZE) {
  const chunk = await contract.queryFilter(
    filter,
    i,
    Math.min(i + CHUNK_SIZE - 1, toBlock)
  );
  events.push(...chunk);
}
```

### 3. Combine Events for Complete State

```javascript
// Get complete pool state
const poolId = "0x1234...";

const [created, updated, swaps, liquidityAdded, liquidityRemoved] = await Promise.all([
  contract.queryFilter(contract.filters.PoolCreated(poolId)),
  contract.queryFilter(contract.filters.PoolUpdated(poolId)),
  contract.queryFilter(contract.filters.Swap(poolId)),
  contract.queryFilter(contract.filters.LiquidityAdded(poolId)),
  contract.queryFilter(contract.filters.LiquidityRemoved(poolId))
]);

const poolState = {
  created: created[0],
  currentState: updated[updated.length - 1],
  totalSwaps: swaps.length,
  totalLiquidityProviders: new Set([
    ...liquidityAdded.map(e => e.args.provider),
    ...liquidityRemoved.map(e => e.args.provider)
  ]).size
};
```

### 4. Real-time Updates

Combine historical data with real-time listeners:

```javascript
// Get historical data
const historicalSwaps = await contract.queryFilter(filter, fromBlock, 'latest');

// Listen for new swaps
contract.on(filter, (poolId, sender, recipient, tokenIn, tokenOut, amountIn, amountOut, event) => {
  // Update UI with new swap
  updateSwapList({
    poolId,
    sender,
    recipient,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash
  });
});
```

---

## Summary

The QuantumDEX AMM events are designed to provide:

1. **Comprehensive Coverage** - All state changes are tracked
2. **Efficient Indexing** - Key parameters are indexed for fast queries
3. **Frontend-Friendly** - Easy to query and display in UI
4. **Gas-Optimized** - Balanced approach between query speed and gas costs
5. **Real-time Updates** - Support for live event listeners

For questions or suggestions, please open an issue on GitHub.
