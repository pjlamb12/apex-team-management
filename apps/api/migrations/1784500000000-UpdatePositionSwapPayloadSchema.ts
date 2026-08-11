import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePositionSwapPayloadSchema1784500000000 implements MigrationInterface {
  name = 'UpdatePositionSwapPayloadSchema1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sports = await queryRunner.query(
      `SELECT "id", "name", "event_definitions" FROM "sports"`
    );

    for (const sport of sports) {
      const defs = sport.event_definitions;
      if (Array.isArray(defs)) {
        let modified = false;
        const updatedDefs = defs.map((def: any) => {
          if (def.type === 'POSITION_SWAP') {
            modified = true;
            return {
              ...def,
              payloadSchema: {
                type: 'object',
                properties: {
                  playerIdA: { type: 'string', format: 'uuid' },
                  playerIdB: { type: 'string', format: 'uuid' },
                  slotIndexA: { type: 'integer' },
                  slotIndexB: { type: 'integer' },
                  positionNameA: { type: 'string' },
                  positionNameB: { type: 'string' },
                },
                required: ['playerIdA'],
                additionalProperties: true,
              },
            };
          }
          return def;
        });

        if (modified) {
          await queryRunner.query(
            `UPDATE "sports" SET "event_definitions" = $1 WHERE "id" = $2`,
            [JSON.stringify(updatedDefs), sport.id]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const sports = await queryRunner.query(
      `SELECT "id", "name", "event_definitions" FROM "sports"`
    );

    for (const sport of sports) {
      const defs = sport.event_definitions;
      if (Array.isArray(defs)) {
        let modified = false;
        const updatedDefs = defs.map((def: any) => {
          if (def.type === 'POSITION_SWAP') {
            modified = true;
            return {
              ...def,
              payloadSchema: {
                type: 'object',
                properties: {
                  playerIdA: { type: 'string', format: 'uuid' },
                  playerIdB: { type: 'string', format: 'uuid' },
                  slotIndexA: { type: 'integer' },
                  slotIndexB: { type: 'integer' },
                },
                required: ['playerIdA', 'playerIdB', 'slotIndexA', 'slotIndexB'],
                additionalProperties: true,
              },
            };
          }
          return def;
        });

        if (modified) {
          await queryRunner.query(
            `UPDATE "sports" SET "event_definitions" = $1 WHERE "id" = $2`,
            [JSON.stringify(updatedDefs), sport.id]
          );
        }
      }
    }
  }
}
