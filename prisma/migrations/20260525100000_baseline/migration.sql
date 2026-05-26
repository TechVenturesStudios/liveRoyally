-- Baseline migration for the existing database schema.
-- Mark this migration as applied on databases that already have these tables.

-- CreateTable
CREATE TABLE "events" (
    "event_id" VARCHAR(50) NOT NULL,
    "partner_id" UUID,
    "title" VARCHAR(150),
    "description" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "member_profiles" (
    "user_id" UUID NOT NULL,
    "network_name" VARCHAR(100),
    "network_code" VARCHAR(50),
    "zip_code" VARCHAR(20),
    "ethnicity" VARCHAR(50),
    "age_group" VARCHAR(20),
    "gender" VARCHAR(20),
    "notification_enabled" BOOLEAN,
    "terms_accepted" BOOLEAN,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "member_vouchers" (
    "member_id" UUID NOT NULL,
    "voucher_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_vouchers_pkey" PRIMARY KEY ("member_id","voucher_id")
);

-- CreateTable
CREATE TABLE "partner_profiles" (
    "user_id" UUID NOT NULL,
    "network_name" VARCHAR(100),
    "network_code" VARCHAR(50),
    "agent_first_name" VARCHAR(100),
    "agent_last_name" VARCHAR(100),
    "agent_phone" VARCHAR(20),
    "org_name" VARCHAR(150),
    "org_address" TEXT,
    "org_email" VARCHAR(150),
    "org_phone" VARCHAR(20),
    "notification_enabled" BOOLEAN,
    "terms_accepted" BOOLEAN,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "provider_profiles" (
    "user_id" UUID NOT NULL,
    "network_name" VARCHAR(100),
    "network_code" VARCHAR(50),
    "agent_first_name" VARCHAR(100),
    "agent_last_name" VARCHAR(100),
    "agent_phone" VARCHAR(20),
    "business_name" VARCHAR(150),
    "business_category" VARCHAR(100),
    "business_address" TEXT,
    "business_email" VARCHAR(150),
    "business_phone" VARCHAR(20),
    "notification_enabled" BOOLEAN,
    "terms_accepted" BOOLEAN,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "purchase_id" SERIAL NOT NULL,
    "member_id" UUID,
    "voucher_id" VARCHAR(50),
    "purchase_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cognito_id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "user_type" VARCHAR(20),
    "display_id" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "voucher_id" VARCHAR(50) NOT NULL,
    "event_id" VARCHAR(50),
    "provider_id" UUID,
    "type" CHAR(1),
    "value" DECIMAL(10,2),
    "expiration_date" DATE,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "promo_item" TEXT,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("voucher_id")
);

-- CreateIndex
CREATE INDEX "idx_events_partner" ON "events"("partner_id");

-- CreateIndex
CREATE INDEX "idx_purchases_member" ON "purchases"("member_id");

-- CreateIndex
CREATE INDEX "idx_purchases_voucher" ON "purchases"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_member_voucher_unique" ON "purchases"("member_id", "voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_id_key" ON "users"("cognito_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_display_id_key" ON "users"("display_id");

-- CreateIndex
CREATE INDEX "idx_users_cognito" ON "users"("cognito_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_vouchers_event" ON "vouchers"("event_id");

-- CreateIndex
CREATE INDEX "idx_vouchers_provider" ON "vouchers"("provider_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "member_vouchers" ADD CONSTRAINT "fk_member" FOREIGN KEY ("member_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "member_vouchers" ADD CONSTRAINT "fk_voucher" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("voucher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "partner_profiles" ADD CONSTRAINT "partner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("voucher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
