-- CreateTable
CREATE TABLE "email_verification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "otp_code_expired" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_product_preference" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "list_type" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_product_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_user_id_idx" ON "email_verification"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_product_preference_user_id_product_id_key" ON "user_product_preference"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_preference" ADD CONSTRAINT "user_product_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_preference" ADD CONSTRAINT "user_product_preference_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
