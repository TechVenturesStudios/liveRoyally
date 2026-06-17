-- AlterTable
ALTER TABLE "partner_profiles" ADD COLUMN     "org_city" TEXT,
ADD COLUMN     "org_state" TEXT,
ADD COLUMN     "org_zip" TEXT;

-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN     "business_city" TEXT,
ADD COLUMN     "business_state" TEXT,
ADD COLUMN     "business_zip" TEXT;
