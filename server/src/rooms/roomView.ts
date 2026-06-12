import type { GameView, PlayerId, PlayerInfo } from '@dual-hangman/shared';
import type { Room, ServerPlayer } from './RoomManager.js';

export function toPlayerInfo(player: ServerPlayer): PlayerInfo {
  return { id: player.id, name: player.name, connected: player.connected };
}

/**
 * Projects a room into the client-safe GameView for one player.
 * Lobby phases only for now — boards stay null.
 * TODO Phase 4: delegate board/turn/winner fields to room.game.
 */
export function buildRoomView(room: Room, playerId: PlayerId): GameView {
  const you = room.players.find((p) => p.id === playerId);
  if (!you) throw new Error(`buildRoomView: player ${playerId} not in room ${room.code}`);
  const opponent = room.players.find((p) => p.id !== playerId);

  return {
    roomCode: room.code,
    phase: room.phase,
    you: toPlayerInfo(you),
    opponent: opponent ? toPlayerInfo(opponent) : null,
    yourBoard: null,
    opponentBoard: null,
    activePlayerId: null,
    winnerId: null,
    gameOverReason: null,
    opponentWordRevealed: null,
  };
}
