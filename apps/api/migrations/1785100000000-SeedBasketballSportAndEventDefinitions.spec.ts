import { describe, it, expect, vi, beforeEach } from 'vitest';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { SeedBasketballSportAndEventDefinitions1785100000000 } from './1785100000000-SeedBasketballSportAndEventDefinitions';

describe('SeedBasketballSportAndEventDefinitions1785100000000', () => {
  const migration = new SeedBasketballSportAndEventDefinitions1785100000000();

  it('should run up migration and execute DDL queries and sport insertion', async () => {
    const queryRunnerMock = {
      query: vi.fn().mockResolvedValue([]),
    };

    await migration.up(queryRunnerMock as any);

    expect(queryRunnerMock.query).toHaveBeenCalledTimes(3);

    // 1. leagues table columns
    const leaguesQuery = queryRunnerMock.query.mock.calls[0][0];
    expect(leaguesQuery).toContain('ALTER TABLE "leagues"');
    expect(leaguesQuery).toContain('"foul_limit"');
    expect(leaguesQuery).toContain('"bonus_threshold"');

    // 2. events table columns
    const eventsQuery = queryRunnerMock.query.mock.calls[1][0];
    expect(eventsQuery).toContain('ALTER TABLE "events"');
    expect(eventsQuery).toContain('"foul_limit"');
    expect(eventsQuery).toContain('"bonus_threshold"');

    // 3. sports table insertion
    const sportQuery = queryRunnerMock.query.mock.calls[2][0];
    const sportParams = queryRunnerMock.query.mock.calls[2][1];
    expect(sportQuery).toContain('INSERT INTO "sports"');
    expect(sportQuery).toContain("'Basketball'");
    expect(sportQuery).toContain('Point Guard');
    expect(sportQuery).toContain('Shooting Guard');
    expect(sportQuery).toContain('Small Forward');
    expect(sportQuery).toContain('Power Forward');
    expect(sportQuery).toContain('Center');

    const eventDefinitions = JSON.parse(sportParams[0]);
    expect(eventDefinitions.length).toBe(20);

    const types = eventDefinitions.map((d: any) => d.type);
    expect(types).toEqual([
      'MADE_1PT',
      'MISSED_1PT',
      'MADE_2PT',
      'MISSED_2PT',
      'MADE_3PT',
      'MISSED_3PT',
      'OPPONENT_SCORE',
      'REBOUND_OFFENSIVE',
      'REBOUND_DEFENSIVE',
      'ASSIST',
      'STEAL',
      'BLOCK',
      'TURNOVER',
      'FOUL',
      'OPPONENT_FOUL',
      'TIMEOUT',
      'SUB',
      'POSITION_SWAP',
      'PERIOD_START',
      'PERIOD_END',
    ]);
  });

  it('should run down migration and clean up', async () => {
    const queryRunnerMock = {
      query: vi.fn().mockResolvedValue([]),
    };

    await migration.down(queryRunnerMock as any);

    expect(queryRunnerMock.query).toHaveBeenCalledTimes(3);
    expect(queryRunnerMock.query.mock.calls[0][0]).toContain('DELETE FROM "sports" WHERE "name" = \'Basketball\'');
    expect(queryRunnerMock.query.mock.calls[1][0]).toContain('ALTER TABLE "events"');
    expect(queryRunnerMock.query.mock.calls[2][0]).toContain('ALTER TABLE "leagues"');
  });

  describe('Basketball event schema validation', () => {
    let ajv: Ajv;
    let eventMap: Map<string, any>;

    beforeEach(async () => {
      ajv = new Ajv();
      addFormats(ajv);

      let capturedParams: any[] = [];
      const queryRunnerMock = {
        query: vi.fn().mockImplementation((_query, params) => {
          if (params) capturedParams = params;
          return Promise.resolve([]);
        }),
      };

      await migration.up(queryRunnerMock as any);
      const defs = JSON.parse(capturedParams[0]);
      eventMap = new Map(defs.map((d: any) => [d.type, d.payloadSchema]));
    });

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const assistorUuid = '223e4567-e89b-12d3-a456-426614174001';

    describe('Shot events (MADE_1PT, MISSED_1PT, MADE_2PT, MISSED_2PT, MADE_3PT, MISSED_3PT)', () => {
      const shotTypes = ['MADE_1PT', 'MISSED_1PT', 'MADE_2PT', 'MISSED_2PT', 'MADE_3PT', 'MISSED_3PT'];

      shotTypes.forEach((type) => {
        it(`${type}: should accept valid shot with coordinates and distance`, () => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            playerId: validUuid,
            x: 45.5,
            y: 22.0,
            distanceFeet: 18.2,
          });
          expect(valid).toBe(true);
        });

        it(`${type}: should accept valid shot without coordinates (keypad rapid entry)`, () => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            playerId: validUuid,
          });
          expect(valid).toBe(true);
        });

        it(`${type}: should reject shot missing playerId`, () => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            x: 45.5,
            y: 22.0,
          });
          expect(valid).toBe(false);
        });

        it(`${type}: should reject shot with non-uuid playerId`, () => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            playerId: 'not-a-uuid',
            x: 10,
            y: 10,
          });
          expect(valid).toBe(false);
        });

        it(`${type}: should reject shot with non-numeric coordinates`, () => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            playerId: validUuid,
            x: 'invalid-coordinate',
            y: 20,
          });
          expect(valid).toBe(false);
        });
      });

      it('MADE_2PT and MADE_3PT should accept assistorId', () => {
        ['MADE_2PT', 'MADE_3PT'].forEach((type) => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          const valid = validate({
            playerId: validUuid,
            x: 30,
            y: 25,
            distanceFeet: 15,
            assistorId: assistorUuid,
          });
          expect(valid).toBe(true);
        });
      });
    });

    describe('Non-shot basketball events', () => {
      it('OPPONENT_SCORE: should accept valid point values 1, 2, 3', () => {
        const schema = eventMap.get('OPPONENT_SCORE');
        const validate = ajv.compile(schema);
        expect(validate({ points: 1 })).toBe(true);
        expect(validate({ points: 2 })).toBe(true);
        expect(validate({ points: 3 })).toBe(true);
        expect(validate({ points: 0 })).toBe(false);
        expect(validate({ points: 4 })).toBe(false);
      });

      it('REBOUND_OFFENSIVE & REBOUND_DEFENSIVE: should require playerId', () => {
        ['REBOUND_OFFENSIVE', 'REBOUND_DEFENSIVE'].forEach((type) => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          expect(validate({ playerId: validUuid })).toBe(true);
          expect(validate({})).toBe(false);
          expect(validate({ playerId: 'invalid' })).toBe(false);
        });
      });

      it('STEAL, BLOCK, TURNOVER, FOUL: should require playerId', () => {
        ['STEAL', 'BLOCK', 'TURNOVER', 'FOUL'].forEach((type) => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          expect(validate({ playerId: validUuid })).toBe(true);
          expect(validate({})).toBe(false);
        });
      });

      it('TIMEOUT: should accept valid team', () => {
        const schema = eventMap.get('TIMEOUT');
        const validate = ajv.compile(schema);
        expect(validate({ team: 'us' })).toBe(true);
        expect(validate({ team: 'opponent' })).toBe(true);
        expect(validate({ team: 'other' })).toBe(false);
      });

      it('SUB: should require inPlayerId, outPlayerId, and positionName', () => {
        const schema = eventMap.get('SUB');
        const validate = ajv.compile(schema);
        expect(
          validate({
            inPlayerId: validUuid,
            outPlayerId: assistorUuid,
            positionName: 'Point Guard',
          })
        ).toBe(true);
        expect(validate({ inPlayerId: validUuid })).toBe(false);
      });

      it('PERIOD_START & PERIOD_END: should require period number', () => {
        ['PERIOD_START', 'PERIOD_END'].forEach((type) => {
          const schema = eventMap.get(type);
          const validate = ajv.compile(schema);
          expect(validate({ period: 1 })).toBe(true);
          expect(validate({})).toBe(false);
        });
      });
    });
  });
});
