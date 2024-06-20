/*
  Warnings:

  - You are about to drop the column `caller_no` on the `voice_calls` table. All the data in the column will be lost.
  - Added the required column `call_id` to the `voice_calls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "voice_calls" DROP COLUMN "caller_no",
ADD COLUMN     "call_id" TEXT NOT NULL;
