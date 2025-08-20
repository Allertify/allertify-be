-- CreateTable
CREATE TABLE "daily_scan_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scan_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_scan_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_scan_usage_user_id_usage_date_key" ON "daily_scan_usage"("user_id", "usage_date");

-- AddForeignKey
ALTER TABLE "daily_scan_usage" ADD CONSTRAINT "daily_scan_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
