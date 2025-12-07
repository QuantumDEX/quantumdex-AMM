# Frontend Issues

This file contains all GitHub issues for the QuantumDEX frontend. Each issue is ready to be copied into GitHub.

## ✅ Completed Issues

### Issue #1: Wallet Integration — Reown AppKit + Wagmi
**Status:** ✅ COMPLETED  
**Labels:** `frontend`, `wallet`, `completed`

**Description:**
Add wallet connection using Reown AppKit (WalletConnect) + Wagmi. Provide a `Navbar` component that shows connect/disconnect, address and network.

**Acceptance Criteria:**
- [x] Users can connect with MetaMask and WalletConnect
- [x] Address displays in navbar
- [x] Network information displays
- [x] Signer is available to send transactions
- [x] Disconnect functionality works

**Implementation Notes:**
- Navbar component implemented at `src/components/navbar.tsx`
- AppKit integration configured in `src/config/adapter.ts`
- Wagmi configuration in `src/config/wagmi.ts`

---

### Issue #2: Ethers/Wagmi Adapter & Provider
**Status:** ✅ COMPLETED  
**Labels:** `frontend`, `infrastructure`, `completed`

**Description:**
Create `src/config/wagmi.ts` and `src/config/adapter.ts` to expose providers and signers to the app.

**Acceptance Criteria:**
- [x] Hooks/components can get an ethers provider from the adapter
- [x] Hooks/components can get an ethers signer from the adapter
- [x] `walletClientToSigner` utility function works
- [x] `publicClientToProvider` utility function works
- [x] Examples work in dev console

**Implementation Notes:**
- Both files implemented with proper type conversions
- Utilities handle viem to ethers conversions correctly

---

### Issue #3: Styling, Accessibility & Responsiveness
**Status:** ✅ COMPLETED  
**Labels:** `frontend`, `ui/ux`, `completed`

**Description:**
Polish UI using Tailwind; ensure components are responsive and accessible.

**Acceptance Criteria:**
- [x] UI passes basic accessibility checks (labels, focus states)
- [x] Components work on mobile widths
- [x] Modern, responsive design with Tailwind CSS
- [x] Dark mode support
- [x] Proper semantic HTML

**Implementation Notes:**
- Modern, responsive UI implemented across all pages
- Tailwind CSS used throughout
- Dark mode support via Tailwind dark: classes

---

## ❌ Pending Issues

### Issue #4: Logo Design & Brand Identity
**Status:** ❌ PENDING  
**Labels:** `frontend`, `design`, `branding`  
**Priority:** HIGH

**Description:**
Create a professional logo and brand identity for QuantumDEX. The logo should be modern, memorable, and work well in both light and dark modes.

**Acceptance Criteria:**
- [ ] Logo designed in multiple formats (SVG, PNG, favicon)
- [ ] Logo works on light and dark backgrounds
- [ ] Logo is scalable (works at small and large sizes)
- [ ] Logo files added to `public/` directory
- [ ] Favicon updated
- [ ] Logo integrated into header/navbar
- [ ] Brand guidelines document (optional but preferred)

**Technical Notes:**
- SVG format preferred for scalability
- Consider creating variations: full logo, icon-only, horizontal/vertical layouts
- Ensure logo is optimized for web (small file size)

---

### Issue #5: UI Rebrand & Landing Page Redesign
**Status:** ✅ COMPLETED  
**Labels:** `frontend`, `design`, `ui/ux`  
**Priority:** HIGH

**Description:**
Complete UI rebrand with a chic, modern design. Remove the current landing page and create a new layout with: header, hero section, feature tabs (Decentralized Exchange / Token Streaming), main content area, and footer. Implement a cohesive color scheme using orange shades OR purple/lilac shades.

**Current State:**
- ✅ Landing page completely redesigned with new layout
- ✅ Purple/lilac color scheme implemented throughout
- ✅ All components created and integrated

**Acceptance Criteria:**
- [x] Remove existing landing page content
- [x] Design and implement new layout structure:
  - [x] Header/Navbar (with logo, navigation, wallet connect)
  - [x] Hero section (compelling introduction to QuantumDEX)
  - [x] Feature tabs section with two tabs:
    - [x] Tab 1: "Decentralized Exchange" - shows DEX interface
    - [x] Tab 2: "Token Streaming" - shows streaming interface
  - [x] Main content area (dynamically shows DEX or Streaming based on selected tab)
  - [x] Footer (links, social, copyright)
- [x] Implement color scheme (choose one):
  - [ ] Orange shades theme (warm, energetic)
  - [x] Purple/lilac shades theme (modern, sophisticated)
- [x] Update Tailwind config with new color palette
- [x] Ensure design is cohesive across all pages
- [x] Maintain responsive design (mobile, tablet, desktop)
- [x] Ensure accessibility (contrast ratios, focus states)
- [x] Tab switching should be smooth with proper state management

**Technical Notes:**
- ✅ Updated `globals.css` with custom color palette using CSS variables
- ✅ Hero section implemented with gradient background and feature highlights
- ✅ Feature tabs component with smooth transitions and ARIA attributes
- ✅ Main content area dynamically renders based on selected tab
- ✅ Footer implemented with clean, minimal design
- ✅ All components use purple/lilac theme consistently

**Implementation Details:**
- Created `src/components/hero.tsx` - Hero section component
- Created `src/components/feature-tabs.tsx` - Tab navigation component
- Created `src/components/dex-interface.tsx` - Simplified DEX interface
- Created `src/components/streaming-interface.tsx` - Streaming interface placeholder
- Created `src/components/footer.tsx` - Footer component
- Updated `src/app/page.tsx` - New landing page layout
- Updated `src/components/navbar.tsx` - Purple/lilac theme styling
- Updated `src/app/globals.css` - Purple/lilac color palette

---

### Issue #6: Port `lib/amm.ts` to ethers (contract bindings)
**Status:** ❌ PENDING  
**Labels:** `frontend`, `critical`, `blocking`, `contract-integration`  
**Priority:** HIGH

**Description:**
Implement ethers contract wrappers to call AMM contract functions and read events. The current `lib/amm.ts` has generic factory/router functions, but needs to be updated to work directly with the AMM contract interface.

**Current State:**
- Generic factory/router functions exist
- AMM ABI is available at `src/lib/abi/AMM.json`
- Pages expect functions that work with the AMM contract directly

**Acceptance Criteria:**
- [ ] `getAllPools(contractAddress, provider)` - Reads PoolCreated events from AMM contract
- [ ] `getPool(poolId, contractAddress, provider)` - Reads pool data using `getPool(bytes32)` function
- [ ] `createPool(tokenA, tokenB, amountA, amountB, contractAddress, signer)` - Calls AMM's `createPool` function
- [ ] `addLiquidity(poolId, amount0, amount1, contractAddress, signer)` - Calls AMM's `addLiquidity` function
- [ ] `removeLiquidity(poolId, liquidity, contractAddress, signer)` - Calls AMM's `removeLiquidity` function
- [ ] `swap(poolId, tokenIn, amountIn, minAmountOut, recipient, contractAddress, signer)` - Calls AMM's `swap` function
- [ ] `getUserLiquidity(poolId, userAddress, contractAddress, provider)` - Calls AMM's `getLpBalance` function
- [ ] All functions return expected types matching the contract interface
- [ ] Functions handle errors appropriately
- [ ] Contract address configuration via environment variable (see Technical Notes)

**Technical Notes:**
- AMM contract uses `bytes32 poolId` (not address)
- PoolCreated event signature: `PoolCreated(bytes32 indexed poolId, address indexed token0, address indexed token1, uint16 feeBps, ...)`
- Contract functions use different signatures than factory/router pattern
- Need to use ABI from `src/lib/abi/AMM.json`
- **Contract Address:** The AMM contract will be deployed and the address will be provided. Use `NEXT_PUBLIC_AMM_CONTRACT_ADDRESS` environment variable. Do not hardcode contract addresses.

**Blocking:**
This issue blocks all contract interaction features (swap, pools, liquidity management).

---

### Issue #7: Swap Component — Contract Integration
**Status:** ❌ PENDING  
**Labels:** `frontend`, `feature`, `swap`  
**Priority:** HIGH  
**Depends on:** #6

**Description:**
Port `src/app/swap/page.tsx` to use the new contract helpers and wallet signer to send swap transactions. The UI exists but uses mock data and generic router functions.

**Current State:**
- UI exists at `/swap` route
- Uses mock token data
- Has quote estimation logic
- Submit button calls generic `amm.swap()` function

**Acceptance Criteria:**
- [ ] User can select tokens from available pools
- [ ] User enters amount to swap
- [ ] Component calculates estimated output using pool reserves
- [ ] Component shows slippage protection
- [ ] User can submit swap transaction
- [ ] Transaction is sent to AMM contract's `swap` function
- [ ] Success/failure feedback displayed
- [ ] Transaction receipt shown
- [ ] Pool reserves update after swap

**Technical Notes:**
- Need to fetch available pools first
- Calculate swap output using constant product formula: `amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)`
- Apply fee: `amountInWithFee = amountIn * (10000 - feeBps) / 10000`
- Need to determine `poolId` from token pair
- Need to determine swap direction (zeroForOne)
- **Contract Address:** Use `NEXT_PUBLIC_AMM_CONTRACT_ADDRESS` environment variable. Contract will be deployed and address provided.

---

### Issue #8: Pools List & Pool Details Component — Contract Integration
**Status:** ❌ PENDING  
**Labels:** `frontend`, `feature`, `pools`  
**Priority:** HIGH  
**Depends on:** #6

**Description:**
Build UI to list pools by reading events or contract state; show pool details and balances. The UI exists but displays mock data.

**Current State:**
- Pools list page exists at `/pools`
- Pool details page exists at `/pools/[poolId]`
- Uses `getAllPools` and `getPool` functions (need implementation)
- Displays mock data

**Acceptance Criteria:**
- [ ] Pools list page reads all pools from AMM contract events
- [ ] Each pool shows: token pair, fee tier, TVL, reserves
- [ ] Pool details page shows: full pool info, reserves, user's LP balance
- [ ] Real-time data updates when pools change
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Links to pool detail pages work

**Technical Notes:**
- Read `PoolCreated` events from AMM contract
- For each pool, call `getPool(bytes32 poolId)` to get current state
- Display reserves, fee, total liquidity
- Calculate TVL (if token prices available)
- **Contract Address:** Use `NEXT_PUBLIC_AMM_CONTRACT_ADDRESS` environment variable. Contract will be deployed and address provided.

---

### Issue #9: Add / Remove Liquidity Components — Contract Integration
**Status:** ❌ PENDING  
**Labels:** `frontend`, `feature`, `liquidity`  
**Priority:** HIGH  
**Depends on:** #6

**Description:**
Implement UI for adding and removing liquidity, with input validation and ratio calculation. The UI exists but needs contract integration.

**Current State:**
- Add liquidity UI exists in pool details page
- Remove liquidity UI exists in pool details page
- Form validation exists
- Not connected to contract

**Acceptance Criteria:**
- [ ] User can select pool to add liquidity to
- [ ] User enters amounts for both tokens
- [ ] Component validates ratio matches pool ratio (for existing pools)
- [ ] Component calculates liquidity shares to mint
- [ ] User can submit add liquidity transaction
- [ ] Transaction sent to AMM contract's `addLiquidity` function
- [ ] User can view their LP balance
- [ ] User can remove liquidity by entering LP shares
- [ ] Component calculates token amounts to receive
- [ ] Remove liquidity transaction sent to AMM contract
- [ ] Success/failure feedback displayed

**Technical Notes:**
- For new pools: any ratio allowed
- For existing pools: must maintain ratio `amount0/amount1 = reserve0/reserve1`
- Liquidity calculation: `liquidity = min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)`
- Need to approve tokens before adding liquidity
- Show user's current LP balance from `getLpBalance`
- **Contract Address:** Use `NEXT_PUBLIC_AMM_CONTRACT_ADDRESS` environment variable. Contract will be deployed and address provided.

---

### Issue #10: Create Pool Component — Contract Integration
**Status:** ❌ PENDING  
**Labels:** `frontend`, `feature`, `pools`  
**Priority:** MEDIUM  
**Depends on:** #6

**Description:**
Allow users to create new pools (token pair + initial liquidity) with deterministic ordering of token addresses. The UI exists but form submission not connected to contract.

**Current State:**
- Create pool page exists at `/pools/new`
- Form has token addresses, amounts, fee tier inputs
- Submit handler exists but needs contract integration

**Acceptance Criteria:**
- [ ] User enters two token addresses
- [ ] Component automatically sorts tokens (token0 < token1)
- [ ] User enters initial liquidity amounts
- [ ] User selects fee tier (uses contract's defaultFeeBps)
- [ ] Component validates inputs
- [ ] User can submit create pool transaction
- [ ] Transaction sent to AMM contract's `createPool` function
- [ ] Pool ID calculated and displayed
- [ ] Success redirects to pool details page
- [ ] New pool appears in pools list

**Technical Notes:**
- Token addresses must be sorted: `token0 = min(tokenA, tokenB)`, `token1 = max(tokenA, tokenB)`
- Pool ID: `keccak256(abi.encodePacked(token0, token1, feeBps))`
- Contract uses `defaultFeeBps` from constructor (not user-selectable in current contract)
- Need to approve both tokens before creating pool
- Initial liquidity sets the starting price
- **Contract Address:** Use `NEXT_PUBLIC_AMM_CONTRACT_ADDRESS` environment variable. Contract will be deployed and address provided.

---

### Issue #11: Frontend Unit/E2E Tests
**Status:** ❌ PENDING  
**Labels:** `frontend`, `testing`, `ci/cd`  
**Priority:** MEDIUM

**Description:**
Add unit tests for helpers and integration/e2e tests for critical flows (DEX: connect, swap, add liquidity; Streaming: create stream, withdraw, refuel).

**Acceptance Criteria:**
- [ ] Unit tests for `lib/amm.ts` functions
- [ ] Unit tests for `lib/streaming.ts` functions
- [ ] Unit tests for `lib/utils.ts` helpers
- [ ] Integration tests for wallet connection flow
- [ ] Integration tests for DEX flows:
  - [ ] Swap flow
  - [ ] Add/remove liquidity flows
  - [ ] Create pool flow
- [ ] Integration tests for Token Streaming flows:
  - [ ] Create stream flow
  - [ ] Withdraw flow
  - [ ] Refuel flow
  - [ ] Update stream details flow
- [ ] E2E tests for critical user journeys (both DEX and Streaming)
- [ ] CI runs tests and reports pass/fail
- [ ] Test coverage > 70%

**Technical Notes:**
- Use Vitest for unit tests
- Use Playwright or Cypress for E2E tests
- Mock contract calls for unit tests
- Use testnet for integration tests
- Set up GitHub Actions for CI

---

## Token Streaming Issues

### Issue #12: Port Token Streaming Contract Library (`lib/streaming.ts`)
**Status:** ❌ PENDING  
**Labels:** `frontend`, `token-streaming`, `critical`, `blocking`  
**Priority:** HIGH

**Description:**
Implement ethers contract wrappers to call Token Streaming contract functions and read events. Create `lib/streaming.ts` with functions to interact with the streaming protocol.

**Acceptance Criteria:**
- [ ] `getAllStreams(contractAddress, provider)` - Reads StreamCreated events from contract
- [ ] `getStream(streamId, contractAddress, provider)` - Reads stream data using `getStream(uint256)` function
- [ ] `createStream(recipient, token, initialBalance, timeframe, paymentPerBlock, contractAddress, signer)` - Calls contract's `createStream` function
- [ ] `refuel(streamId, amount, contractAddress, signer)` - Calls contract's `refuel` function
- [ ] `withdraw(streamId, contractAddress, signer)` - Calls contract's `withdraw` function (recipient)
- [ ] `refund(streamId, contractAddress, signer)` - Calls contract's `refund` function (sender)
- [ ] `updateStreamDetails(streamId, paymentPerBlock, timeframe, signature, signerAddress, contractAddress, signer)` - Calls contract's `updateStreamDetails` function
- [ ] `getWithdrawableBalance(streamId, account, contractAddress, provider)` - Calls contract's `getWithdrawableBalance` function
- [ ] `hashStream(streamId, newPaymentPerBlock, newTimeframe, contractAddress, provider)` - Calls contract's `hashStream` function for signature generation
- [ ] All functions return expected types matching the contract interface
- [ ] Functions handle errors appropriately
- [ ] STREAMING_CONTRACT_ADDRESS constant exported

**Technical Notes:**
- Token Streaming contract uses `uint256 streamId`
- StreamCreated event signature: `StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, ...)`
- Need to use ABI from `src/lib/abi/TokenStreaming.json`
- Signature verification needed for `updateStreamDetails`
- **Contract Address:** Use `NEXT_PUBLIC_STREAMING_CONTRACT_ADDRESS` environment variable. Contract will be deployed and address provided.

**Blocking:**
This issue blocks all token streaming frontend features.

---

### Issue #13: Token Streaming UI Components
**Status:** ❌ PENDING  
**Labels:** `frontend`, `token-streaming`, `feature`  
**Priority:** HIGH  
**Depends on:** #12

**Description:**
Build UI components for token streaming functionality. Create pages and components for creating streams, viewing active streams, withdrawing tokens, and managing stream parameters.

**Acceptance Criteria:**
- [ ] Create Stream page (`/streams/new`) with form to:
  - [ ] Select recipient address
  - [ ] Select token (ERC20)
  - [ ] Enter initial balance
  - [ ] Set timeframe (start block, end block)
  - [ ] Set payment per block
- [ ] Streams List page (`/streams`) showing:
  - [ ] All streams user is involved in (as sender or recipient)
  - [ ] Stream status (active, ended, pending)
  - [ ] Withdrawable balance
  - [ ] Stream details (timeframe, payment rate)
- [ ] Stream Details page (`/streams/[streamId]`) showing:
  - [ ] Full stream information
  - [ ] Withdrawable balance for recipient
  - [ ] Refundable balance for sender
  - [ ] Withdraw/Refund buttons
  - [ ] Refuel button (for sender)
  - [ ] Update stream details section (with signature flow)
- [ ] Withdraw component for recipients
- [ ] Refund component for senders
- [ ] Refuel component for senders
- [ ] Update stream details component with signature generation/verification
- [ ] Real-time balance updates
- [ ] Loading and error states

**Technical Notes:**
- Need to handle signature generation for stream updates
- Calculate withdrawable balance based on current block and payment per block
- Show visual progress of stream (time elapsed vs total time)
- Handle both sender and recipient views
- **Contract Address:** Use `NEXT_PUBLIC_STREAMING_CONTRACT_ADDRESS` environment variable.

---

### Issue #14: Token Streaming Integration in Landing Page
**Status:** ❌ PENDING  
**Labels:** `frontend`, `token-streaming`, `ui/ux`  
**Priority:** HIGH  
**Depends on:** #5, #13

**Description:**
Integrate token streaming interface into the landing page feature tabs. When users click the "Token Streaming" tab, show the streaming interface instead of the DEX interface.

**Acceptance Criteria:**
- [ ] "Token Streaming" tab shows streaming interface when selected
- [ ] Tab switching works smoothly between DEX and Streaming
- [ ] Streaming interface includes:
  - [ ] Quick create stream form
  - [ ] List of user's active streams
  - [ ] Quick actions (withdraw, refuel)
- [ ] Consistent styling with DEX interface
- [ ] Responsive design

**Technical Notes:**
- Use same tab component from Issue #5
- State management for active tab
- Conditional rendering based on selected tab

---

## Issue Template

When creating issues in GitHub, use this format:

```markdown
## Description
[Copy description from above]

## Acceptance Criteria
[Copy acceptance criteria from above]

## Technical Notes
[Copy technical notes if any]

## Dependencies
[List any blocking issues]

## Labels
[Add appropriate labels]
```

