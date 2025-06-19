

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "username" TEXT,
    "role" TEXT CHECK (role IN ('patient', 'doctor', 'admin')) NOT NULL,
    "experience" TEXT,
    "location" TEXT,
    "license_number" TEXT,
    "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE "conversation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES users(id) ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE "messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "con_id" UUID REFERENCES conversation(id) ON DELETE CASCADE,
    "sender" TEXT CHECK (sender IN ('user', 'assistant')),
    "content" TEXT,
    "timestamp" TIMESTAMP DEFAULT now()
);

CREATE TABLE "summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "conversation_id" UUID REFERENCES conversation(id) ON DELETE CASCADE,
    "patient_id" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "doctor_id" UUID NOT NULL REFERENCES users(id),
    "created_at" TIMESTAMP DEFAULT now()
);
