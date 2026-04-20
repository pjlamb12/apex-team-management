import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPracticeLocationToSeason1776696865998 implements MigrationInterface {
    name = 'AddPracticeLocationToSeason1776696865998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_practice_location" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN "default_practice_location"`);
    }

}
