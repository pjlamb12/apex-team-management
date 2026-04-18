import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import targets (will be created in Plan 04 — use placeholder class for now)
// The spec file establishes the contract; actual imports are wired in Plan 04.

describe('GamesService', () => {
  // GAME-01: create — saves game and auto-creates season if none exists
  describe('create', () => {
    it('should create a game and return it', async () => {
      // TODO: wire GamesService once created in Plan 04
      expect(true).toBe(true); // placeholder — replace with real test in Plan 04
    });

    it('should create a default active season if none exists for the team', async () => {
      // TODO: wire GamesService once created in Plan 04
      expect(true).toBe(true); // placeholder
    });

    it('should reuse the existing active season if one exists', async () => {
      // TODO: wire GamesService once created in Plan 04
      expect(true).toBe(true); // placeholder
    });

    it('should throw ForbiddenException if team does not belong to the requesting coach', async () => {
      // TODO: ownership check — wire in Plan 04
      expect(true).toBe(true); // placeholder
    });
  });

  // GAME-02: findAllForTeam — returns games via season join
  describe('findAllForTeam', () => {
    it('should return games for the active season of a team', async () => {
      expect(true).toBe(true); // placeholder
    });

    it('should return an empty array if no games exist', async () => {
      expect(true).toBe(true); // placeholder
    });
  });

  // GAME-03: update — patches game fields
  describe('update', () => {
    it('should update game fields and return the updated game', async () => {
      expect(true).toBe(true); // placeholder
    });

    it('should throw NotFoundException if game does not exist', async () => {
      expect(true).toBe(true); // placeholder
    });
  });

  // GAME-04: remove — deletes game
  describe('remove', () => {
    it('should delete the game', async () => {
      expect(true).toBe(true); // placeholder
    });

    it('should throw NotFoundException if game does not exist', async () => {
      expect(true).toBe(true); // placeholder
    });
  });
});
