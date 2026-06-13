import { describe, expect, it } from 'vitest';
import { GameManager } from '../game/GameManager.js';
import { RoomManager } from './RoomManager.js';
import { buildRoomView } from './roomView.js';

function twoPlayerRoom() {
  const manager = new RoomManager();
  const room = manager.createRoom('Alice');
  const join = manager.joinRoom(room.code, 'Bob');
  if (!join.ok) throw new Error('join failed');
  return { room, host: room.players[0], joiner: join.player };
}

describe('buildRoomView', () => {
  it('reports word-ready flags per player', () => {
    const { room, host, joiner } = twoPlayerRoom();
    host.secretWord = 'PUZZLE';

    const hostView = buildRoomView(room, host.id);
    expect(hostView.yourWordReady).toBe(true);
    expect(hostView.opponentWordReady).toBe(false);

    const joinerView = buildRoomView(room, joiner.id);
    expect(joinerView.yourWordReady).toBe(false);
    expect(joinerView.opponentWordReady).toBe(true);
  });

  it('keeps boards null until the game exists', () => {
    const { room, host } = twoPlayerRoom();
    const view = buildRoomView(room, host.id);
    expect(view.yourBoard).toBeNull();
    expect(view.opponentBoard).toBeNull();
    expect(view.activePlayerId).toBeNull();
  });

  it('exposes boards and the active player once the game starts', () => {
    const { room, host, joiner } = twoPlayerRoom();
    // L, I, O never appear in room codes (ROOM_CODE_ALPHABET excludes them),
    // so the anti-cheat substring assertions below cannot collide with the code.
    host.secretWord = 'LIONESS';
    joiner.secretWord = 'OIL';
    room.game = new GameManager(
      { playerId: host.id, secretWord: host.secretWord },
      { playerId: joiner.id, secretWord: joiner.secretWord },
    );
    room.phase = 'playing';

    const hostView = buildRoomView(room, host.id);
    // The host guesses the joiner's word (OIL); the joiner guesses LIONESS.
    expect(hostView.yourBoard?.maskedWord).toHaveLength(3);
    expect(hostView.opponentBoard?.maskedWord).toHaveLength(7);
    expect([host.id, joiner.id]).toContain(hostView.activePlayerId);

    const joinerView = buildRoomView(room, joiner.id);
    expect(joinerView.yourBoard?.maskedWord).toHaveLength(7);
    expect(joinerView.opponentBoard?.maskedWord).toHaveLength(3);

    // Anti-cheat: no view ever contains a raw secret word.
    expect(JSON.stringify(hostView)).not.toContain('LIONESS');
    expect(JSON.stringify(hostView)).not.toContain('OIL');
    expect(JSON.stringify(joinerView)).not.toContain('OIL');
    expect(JSON.stringify(joinerView)).not.toContain('LIONESS');
  });
});
