import type { GameView, PlayerId, PlayerInfo } from '@dual-hangman/shared';
import type { Room, ServerPlayer } from './RoomManager.js';

export function toPlayerInfo(player: ServerPlayer): PlayerInfo {
  return { id: player.id, name: player.name, connected: player.connected };
}

/**
 * Projects a room into the client-safe GameView for one player.
 * Anti-cheat invariant: the opponent's unsolved word never appears here —
 * boards only expose revealed letters.
 */
export function buildRoomView(room: Room, playerId: PlayerId): GameView {
  const you = room.players.find((p) => p.id === playerId);
  if (!you) throw new Error(`buildRoomView: player ${playerId} not in room ${room.code}`);
  const opponent = room.players.find((p) => p.id !== playerId);
  const game = room.game;

  return {
    roomCode: room.code,
    phase: room.phase,
    you: toPlayerInfo(you),
    opponent: opponent ? toPlayerInfo(opponent) : null,
    yourWordReady: you.secretWord !== null,
    opponentWordReady: opponent ? opponent.secretWord !== null : false,
    yourBoard: game ? game.boardFor(you.id) : null,
    opponentBoard: game && opponent ? game.boardFor(opponent.id) : null,
    activePlayerId: game ? game.activePlayerId : null,
    winnerId: game ? game.winnerId : null,
    gameOverReason: game ? game.gameOverReason : null,
    // At game over, reveal the word THIS player was guessing (their target) —
    // the loser finally sees the word they could not finish.
    opponentWordRevealed: game && room.phase === 'game_over' ? game.targetWordFor(you.id) : null,
  };
}
