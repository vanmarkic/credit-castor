# Copropriété Redistribution Mechanism

## Overview

When a newcomer buys a lot from the copropriété, their payment is automatically redistributed to all existing participants (founders and earlier newcomers) based on their quotité (ownership share). This creates a recursive redistribution system where each new purchase benefits all current co-owners proportionally.

## Short Explanation (1000 characters)

When a newcomer buys from copropriété, their payment is automatically redistributed to all existing participants (founders + earlier newcomers) based on quotité. Process: (1) Calculate newcomer's price using quotité = (their surface) / (total surface including them). (2) Split payment: 30% → copro reserves, 70% → existing participants. (3) Distribute 70% proportionally: each participant gets (their quotité) × 70%. Quotité = (participant's surface) / (total surface at sale date, including buyer). This is recursive: when Gen 2 joins, Gen 1 newcomers also receive redistribution alongside founders. Quotités dilute as more participants join, but each sale benefits all existing co-owners proportionally. See state machine action `recordCompletedSale` in `creditCastorMachine.ts` for implementation.

## How It Works

**Purchase Price Calculation:**
- Newcomer's quotité = (their surface) / (total surface including their purchase)
- Base price = quotité × total project cost
- Final price = base price + indexation (2%/year) + carrying costs recovery

**Payment Split:**
- 30% → Copropriété reserves (for building maintenance/repairs)
- 70% → Redistributed to existing participants

**Redistribution Formula:**
- Each participant's quotité = (their surface) / (total surface of all participants at sale date, including the buyer)
- Each participant receives = 70% of payment × their quotité

**Recursive Nature:**
When a Gen 2 newcomer joins:
1. Gen 1 newcomers receive redistribution (alongside founders)
2. Quotités dilute as total surface increases
3. Each subsequent sale benefits all existing participants proportionally

## Example

Founder Alice (200m²) and Newcomer Bob (50m²) exist. Charlie buys 50m² from copro for 40,000€.

**Charlie's quotité:** 50/(200+50+50) = 16.67%
**Payment split:** 12,000€ to reserves, 28,000€ to participants

**Redistribution:**
- Alice: 200/(200+50+50) = 66.67% → 18,667€
- Bob: 50/(200+50+50) = 16.67% → 4,667€
- Charlie: Included in denominator but receives nothing (is the buyer)

## Integration

This mechanism is integrated into:
- `calculateNewcomerPurchasePrice()` - Calculates newcomer's payment using quotité
- `calculateCoproRedistribution()` - Distributes 70% share to existing participants
- `calculateCoproRedistributionForParticipant()` - Tracks historical redistributions per participant
- State machine `recordCompletedSale` action - Executes redistribution on copro sales
- `ExpectedPaybacksCard` component - Displays expected redistributions to users

