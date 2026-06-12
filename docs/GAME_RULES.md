# Game Rules

> This file is the source of truth for gameplay rules. Update it whenever a rule changes.

## Overview

Two players compete head-to-head. Each player secretly chooses a word; they then take alternating turns guessing letters of the other player's word. Solve the opponent's word before you are hanged.

## Setup

1. Both players join the same game room via a shared room code.
2. Each player privately enters their secret word (letters only, minimum 3 characters, maximum 12 characters).
3. Once both players have submitted their words, the round begins. The first turn is assigned **randomly**.

## Gameplay (turn-based — ADR-004)

- Players alternate turns. On your turn you guess exactly **one letter** against the opponent's word.
- The turn passes to the opponent after every guess, **whether or not it was correct**.
- **Correct guess:** the letter is revealed in every position it appears in the opponent's word.
- **Incorrect guess:** one body part is added to **your** hangman figure (the opponent's figure is unaffected).
- Guessing a letter you already tried is rejected and does not consume your turn.
- You always see both boards: your progress on their word, and their progress on yours (revealed letters only — never the hidden word itself).

## Winning and Losing

Checked after every guess, in this order:

1. **Word solved** — you revealed the last hidden letter of the opponent's word: **you win**.
2. **Hanged** — your wrong-guess count reached 6: **opponent wins**.
3. **Forfeit** — a player leaves the game or stays disconnected past the 60-second grace period: **the remaining player wins**.

Because play is turn-based, a draw cannot occur.

## Wrong Guess Limit

6 wrong guesses per player (head, body, left arm, right arm, left leg, right leg).

## Valid Words

- Letters only (A–Z, case-insensitive; stored and compared uppercase).
- Minimum length: 3 characters. Maximum length: 12 characters.
- No dictionary or proper-noun enforcement at MVP (honour system).

## Disconnection

A disconnected player has **60 seconds** to reconnect (the opponent sees a countdown). Reconnecting restores the full game state. Failing to return forfeits the round.

## Scoring (future — Phase 7)

Multi-round sessions will track a cumulative score. Rules TBD.

## Chat / Communication (future — Phase 6)

Players may send short messages via a sidebar chat during the game. Chat is optional and does not affect gameplay.
