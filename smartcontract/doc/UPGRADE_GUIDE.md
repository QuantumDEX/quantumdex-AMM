# QuantumDEX AMM Upgrade Guide

## Overview

The QuantumDEX AMM contract now supports upgradeability using the **UUPS (Universal Upgradeable Proxy Standard)** pattern. This allows for future upgrades while preserving all state and user data.

---

## Architecture

### Proxy Pattern
- **Proxy Contract**: Holds all state and delegates calls to implementation
- **Implementation Contract**: Contains the business logic (AMMUpgradeable.sol)
- **Admin**: Owner can authorize upgrades via `_authorizeUpgrade()`

### Key Components
1. **AMMUpgradeable.sol** - Upgradeable implementation
2. **deploy-amm-upgradeable.ts** - Initial deployment script
3. **upgrade-amm.ts** - Upgrade script for new versions
4. **AMM.upgrade.test.ts** - Comprehensive upgrade tests

---

## Deployment

### Initial Deployment

```bash
# Deploy to Base Sepolia (testnet)
cd smartcontract
npx hardhat run scripts/deploy-amm-upgradeable.ts --network baseSepolia

# Deploy to Base (mainnet)
npx hardhat run scripts/deploy-amm-upgradeable.ts --network base
```

**Important**: Save the proxy address! This is the address users will interact with.

### Deployment Output
```
Proxy address: 0x...          ← Use this for all interactions
Implementation address: 0x... ← Internal, changes on upgrade
Admin address: 0x...          ← Internal
```

---

## Upgrading

### Step 1: Create New Implementation

Create a new contract (e.g., `AMMUpgradeableV2.sol`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./AMMUpgradeable.sol";

contract AMMUpgradeableV2 is AMMUpgradeable {
    // Add new state variables at the END
    uint256 public newFeature;
    
    // Add new functions
    function setNewFeature(uint256 _value) external onlyOwner {
        newFeature = _value;
    }
    
    // Override existing functions if needed
    // ...
}
```

**CRITICAL RULES**:
- ✅ Add new variables at the END
- ❌ Never remove existing variables
- ❌ Never change variable types
- ❌ Never reorder variables
- ✅ Can add new functions
- ✅ Can override existing functions

### Step 2: Test the Upgrade

```bash
# Run upgrade tests
npx hardhat test test/AMM.upgrade.test.ts

# Validate storage layout
npx hardhat run scripts/validate-upgrade.ts
```

### Step 3: Deploy to Testnet First

```bash
# Set proxy address
export PROXY_ADDRESS=0x...  # Your proxy address

# Upgrade on testnet
npx hardhat run scripts/upgrade-amm.ts --network baseSepolia
```

### Step 4: Verify State Preservation

After upgrade, verify:
- ✅ All pools still exist
- ✅ Reserves unchanged
- ✅ LP balances unchanged
- ✅ Owner unchanged
- ✅ Default fee unchanged

### Step 5: Deploy to Mainnet

```bash
# Set mainnet proxy address
export PROXY_ADDRESS=0x...  # Your mainnet proxy address

# Upgrade on mainnet
npx hardhat run scripts/upgrade-amm.ts --network base
```

---

## Security Considerations

### Access Control
- Only the contract owner can upgrade
- Consider using a multisig wallet as owner for production
- Consider adding a timelock for upgrade proposals

### Storage Layout
- **NEVER** change the storage layout of existing variables
- Use the storage gap (`__gap`) for future additions
- Always validate upgrades with `upgrades.validateUpgrade()`

### Testing
- Always test upgrades on testnet first
- Run full test suite before upgrading
- Verify state preservation after upgrade

### Emergency Procedures
- If upgrade fails, previous implementation remains active
- Proxy address never changes
- Can deploy a rollback implementation if needed

---

## Upgrade Checklist

Before upgrading to production:

- [ ] New implementation contract created
- [ ] Storage layout validated (no conflicts)
- [ ] All tests passing (including upgrade tests)
- [ ] Deployed and tested on testnet
- [ ] State preservation verified on testnet
- [ ] Code reviewed by team
- [ ] Security audit completed (for major changes)
- [ ] Upgrade transaction prepared
- [ ] Multisig signers ready (if using multisig)
- [ ] Monitoring tools ready
- [ ] Rollback plan prepared

---

## Common Issues

### Issue: "Storage layout is incompatible"
**Solution**: You changed the storage layout. Revert changes and add new variables at the end.

### Issue: "Unauthorized"
**Solution**: You're not the owner. Use the owner account to upgrade.

### Issue: "Initialize called twice"
**Solution**: Don't call `initialize()` on upgrades. It's only for initial deployment.

### Issue: "Function selector clash"
**Solution**: Ensure new functions don't have the same selector as proxy functions.

---

## Example Upgrade Scenarios

### Adding a New Fee Type

```solidity
contract AMMUpgradeableV2 is AMMUpgradeable {
    // Add at the end
    uint16 public flashLoanFeeBps;
    
    function setFlashLoanFee(uint16 _fee) external onlyOwner {
        if (_fee > 1000) revert FeeTooHigh();
        flashLoanFeeBps = _fee;
    }
}
```

### Adding Emergency Pause

```solidity
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract AMMUpgradeableV2 is AMMUpgradeable, PausableUpgradeable {
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override swap to add pause check
    function swap(...) external override whenNotPaused {
        super.swap(...);
    }
}
```

---

## Monitoring

After upgrade, monitor:
- Transaction success rate
- Gas costs (may change with new implementation)
- Event emissions
- Pool reserves
- User balances

---

## Support

For questions or issues:
- Check test files for examples
- Review OpenZeppelin upgrade docs: https://docs.openzeppelin.com/upgrades-plugins
- Open an issue on GitHub

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| V1 | 2026-01-03 | Initial UUPS implementation |

---

**Remember**: The proxy address is permanent. Always use it for interactions!
