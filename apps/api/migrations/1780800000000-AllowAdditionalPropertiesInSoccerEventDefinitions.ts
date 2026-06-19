import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowAdditionalPropertiesInSoccerEventDefinitions1780800000000 implements MigrationInterface {
  name = 'AllowAdditionalPropertiesInSoccerEventDefinitions1780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      if (Array.isArray(events)) {
        const updatedEvents = events.map((event: any) => {
          if (event.payloadSchema) {
            return {
              ...event,
              payloadSchema: {
                ...event.payloadSchema,
                additionalProperties: true
              }
            };
          }
          return event;
        });

        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
          [JSON.stringify(updatedEvents)]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      if (Array.isArray(events)) {
        const originalStrictTypes = ['GOAL', 'ASSIST', 'SUB', 'CARD', 'YELLOW_CARD', 'RED_CARD', 'OPPONENT_GOAL'];
        const updatedEvents = events.map((event: any) => {
          if (event.payloadSchema && originalStrictTypes.includes(event.type)) {
            return {
              ...event,
              payloadSchema: {
                ...event.payloadSchema,
                additionalProperties: false
              }
            };
          }
          return event;
        });

        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
          [JSON.stringify(updatedEvents)]
        );
      }
    }
  }
}
