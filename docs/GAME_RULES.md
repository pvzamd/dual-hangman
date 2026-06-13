# Game Rules

> This file is the source of truth for gameplay rules. Update it whenever a rule changes.

## Overview

Two players compete head-to-head. Each player secretly chooses a word; they then take turns guessing letters of the other player's word. **The only way to win is to fully reveal the opponent's word first.**

## Setup

1. Both players join the same game room via a shared room code.
2. Each player privately enters their secret word (letters only, minimum 3 characters, maximum 12 characters).
3. Once both players have submitted their words, the round begins. The first turn is assigned **randomly**.

## Gameplay (turn-based — ADR-004, revised by ADR-009)

- On your turn you guess one letter against the opponent's word.
- **Correct guess:** the letter is revealed in every position it appears in the opponent's word, and **you immediately guess again** — your turn continues as long as you keep guessing correctly.
- **Incorrect guess:** your turn ends and control passes to the opponent. The wrong guess is recorded for statistics, but carries **no gameplay penalty**.
- Guessing a letter you already tried against that word is rejected and does not end your turn.
- You always see both boards: your progress on their word, and their progress on yours (revealed letters only — never the hidden word itself).

## Winning and Losing

- **Win** — you reveal the last hidden letter of the opponent's word. This is the only gameplay win condition.
- **Forfeit** — a player leaves the game or stays disconnected past the 60-second grace period: the remaining player wins.
- There is **no loss by wrong guesses**. You cannot be eliminated; you can only be outraced.
- A draw cannot occur: letters never repeat against the same word, so every turn permanently consumes at least one of 26 letters, and one player must eventually complete the opponent's word.

## Wrong Guesses and the Hangman Figure

- Wrong guesses are **counted for statistics and UI only** (e.g. accuracy display, post-game summary). They never cause defeat.
- The hangman figure is purely **cosmetic**: it is drawn only at game over, displayed for the **losing** player as the defeat visual. No figure is shown or built up during play.

## Game Over and Rematch

- When the round ends, **both secret words are revealed** to both players — your own word and your opponent's word.
- The loser sees the cosmetic hangman figure; the winner sees a victory message. A forfeit win is labelled as such ("your opponent left").
- Either player may offer a **rematch**. It begins only when **both** players opt in (the same mutual-readiness model as word submission): the first to ask waits for the other to accept.
- A rematch keeps the same room and players but starts a fresh round — secret words are cleared and re-entered, and the first turn is randomised again.
- If a player declines by leaving, or the opponent is no longer available, the other player is returned to the lobby (the room reverts to waiting for an opponent).

## Valid Words

- Letters only (A–Z, case-insensitive; stored and compared uppercase).
- Minimum length: 3 characters. Maximum length: 12 characters.
- No dictionary or proper-noun enforcement at MVP (honour system).

## Disconnection

A disconnected player has **60 seconds** to reconnect (the opponent sees a countdown). Reconnecting restores the full game state. Failing to return forfeits the round.

## Scoring (future — Phase 7)

Multi-round sessions will track a cumulative score. Wrong-guess statistics may feed into it. Rules TBD.

## Chat / Communication

Players may send short messages via the in-room chat during the game. Chat is optional, **ephemeral** (not stored anywhere), capped per message, and does not affect gameplay.
