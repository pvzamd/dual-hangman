# Game Rules

> This file is the source of truth for gameplay rules. Update it whenever a rule changes.

## Overview

Two players compete simultaneously. Each player secretly chooses a word; both then try to guess the other player's word before running out of attempts.

## Setup

1. Both players join the same game room via a shared room code.
2. Each player privately enters their secret word (letters only, minimum 3 characters, maximum 12 characters).
3. Once both players have submitted their words, the round begins.

## Gameplay

- Players take turns **or** guess simultaneously (TBD — see [DECISIONS.md](DECISIONS.md)).
- On their turn a player guesses a single letter.
- **Correct guess:** the letter is revealed in all positions it appears in the opponent's word.
- **Incorrect guess:** one body part is added to the player's hangman figure. The player's opponent's figure is unaffected.

## Winning and Losing

- A player **wins** the round by revealing all letters of the opponent's word before exhausting their wrong guesses.
- A player **loses** if the hangman figure is completed (6 wrong guesses) before the opponent's word is solved.
- If both players solve the word before either is hanged the player who solved it in **fewer wrong guesses** wins. If tied, the player who solved it **faster** (by time) wins.
- If both players exhaust guesses simultaneously the round is a **draw**.

## Wrong Guess Limit

6 wrong guesses per player (head, body, left arm, right arm, left leg, right leg).

## Valid Words

- Letters only (A–Z, case-insensitive).
- Minimum length: 3 characters.
- Maximum length: 12 characters.
- No proper nouns enforcement at MVP (honour system).

## Scoring (future)

Multi-round sessions will track a cumulative score. Rules TBD in a later phase.

## Chat / Communication

Players may send short messages via a sidebar chat during the game. Chat is optional and does not affect gameplay.
