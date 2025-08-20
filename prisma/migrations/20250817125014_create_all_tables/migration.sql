-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "role" INTEGER NOT NULL,
    "profile_picture_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergen" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_custom" BOOLEAN NOT NULL,

    CONSTRAINT "allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_plan" (
    "id" SERIAL NOT NULL,
    "plan_type" VARCHAR(20) NOT NULL,
    "scan_count_limit" INTEGER NOT NULL,
    "saved_product_limit" INTEGER NOT NULL,

    CONSTRAINT "tier_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "nutritional_score" VARCHAR(10) NOT NULL,
    "ingredients" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contact" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,

    CONSTRAINT "emergency_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tier_plan_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_allergen" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "allergen_id" INTEGER NOT NULL,
    "security_level" VARCHAR(20) NOT NULL,

    CONSTRAINT "user_allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_report" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "report_details" VARCHAR(255) NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_scan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "scan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "risk_level" VARCHAR(20) NOT NULL,
    "risk_explanation" TEXT,
    "matched_allergens" TEXT,
    "is_saved" BOOLEAN NOT NULL,

    CONSTRAINT "product_scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "allergen_name_key" ON "allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tier_plan_plan_type_key" ON "tier_plan"("plan_type");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcode_key" ON "product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "user_allergen_user_id_allergen_id_key" ON "user_allergen"("user_id", "allergen_id");

-- AddForeignKey
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_tier_plan_id_fkey" FOREIGN KEY ("tier_plan_id") REFERENCES "tier_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergen" ADD CONSTRAINT "user_allergen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergen" ADD CONSTRAINT "user_allergen_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_report" ADD CONSTRAINT "product_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_report" ADD CONSTRAINT "product_report_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scan" ADD CONSTRAINT "product_scan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_scan" ADD CONSTRAINT "product_scan_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
