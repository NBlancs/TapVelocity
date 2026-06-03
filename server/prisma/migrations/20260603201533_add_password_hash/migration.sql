-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Update existing rows with a default hashed password ('password123')
UPDATE "User" SET "passwordHash" = 'f8e9da3c2b1a0d9e8f7c6b5a4d3c2b1a:0da6f1b2192fc7706769b1b06db7f1486e695b681a52ad9a737a51d836f60d72016e15b88e23349c788eea06d6e393747e98376cba6242d9c5604c82a884d179';

-- Make the column NOT NULL now that it is populated
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
