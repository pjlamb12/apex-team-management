import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamIdToLocations1777780603397 implements MigrationInterface {
    name = 'AddTeamIdToLocations1777780603397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Clear existing locations to avoid NOT NULL constraint violation for team_id
        await queryRunner.query(`DELETE FROM "locations"`);
        
        await queryRunner.query(`ALTER TABLE "locations" ADD "team_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "team_id"`);
    }

}
