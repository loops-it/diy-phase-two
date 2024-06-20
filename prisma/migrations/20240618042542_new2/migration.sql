-- CreateTable
CREATE TABLE "flow_form_submissions" (
    "id" SERIAL NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_data" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flow_form_submissions_pkey" PRIMARY KEY ("id")
);
