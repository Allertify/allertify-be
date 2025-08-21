-- Make emergency_contact unique per user (1:1 relationship)
ALTER TABLE "emergency_contact" ADD CONSTRAINT "emergency_contact_user_id_key" UNIQUE ("user_id");

-- Drop any existing duplicate records (keep the first one per user)
DELETE FROM "emergency_contact" 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM "emergency_contact" 
  GROUP BY user_id
);
