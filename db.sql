CREATE SCHEMA "public";
CREATE TYPE "Role" AS ENUM('USER', 'ADMIN');
CREATE TYPE "Plan" AS ENUM('FREE', 'PRO');
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
CREATE TABLE "User" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" Role DEFAULT 'USER' NOT NULL,
	"plan" Plan DEFAULT 'FREE' NOT NULL,
	"stripeCustId" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"name" text,
	"resetToken" text,
	"resetTokenExpires" timestamp,
	"verificationCode" text,
	"verificationExpires" timestamp
);
CREATE TABLE "YearData" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"year" integer NOT NULL,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp NOT NULL
);
ALTER TABLE "YearData" ADD CONSTRAINT "YearData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_prisma_migrations_pkey" ON "_prisma_migrations" ("id");
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX "User_pkey" ON "User" ("id");
CREATE UNIQUE INDEX "User_stripeCustId_key" ON "User" ("stripeCustId");
CREATE UNIQUE INDEX "YearData_pkey" ON "YearData" ("id");
CREATE INDEX "YearData_userId_idx" ON "YearData" ("userId");
CREATE UNIQUE INDEX "YearData_userId_year_key" ON "YearData" ("userId","year");
