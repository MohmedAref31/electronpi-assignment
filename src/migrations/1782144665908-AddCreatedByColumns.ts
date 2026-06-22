import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByColumns1782144665908 implements MigrationInterface {
    name = 'AddCreatedByColumns1782144665908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "createdById" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "createdById" integer NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7c5e5e3d2f4f5a9e1b9c4d6e7f" ON "projects" ("createdById") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d6f6e4e3f5f6b0f2c0d5e7f8a" ON "tasks" ("createdById") `);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_7c5e5e3d2f4f5a9e1b9c4d6e7f" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_8d6f6e4e3f5f6b0f2c0d5e7f8a" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_8d6f6e4e3f5f6b0f2c0d5e7f8a"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_7c5e5e3d2f4f5a9e1b9c4d6e7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d6f6e4e3f5f6b0f2c0d5e7f8a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c5e5e3d2f4f5a9e1b9c4d6e7f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "createdById"`);
    }

}
