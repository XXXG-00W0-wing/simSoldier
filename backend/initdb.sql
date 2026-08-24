-- Initialize roles table and default roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

INSERT INTO roles (id, name) VALUES (1, '準備入營') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO roles (id, name) VALUES (2, '正在入營') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO roles (id, name) VALUES (3, '延後入營') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO roles (id, name) VALUES (4, 'admin') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Initialize users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  date_of_registration TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  hashed_password VARCHAR(255) NOT NULL
);

-- Initialize user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role INTEGER REFERENCES roles(id),
  game_progress INTEGER DEFAULT 0,
  date_of_birth DATE,
  height INTEGER,
  weight INTEGER,
  entrance_date DATE
);

-- Initialize quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  explanation VARCHAR(255),
  source VARCHAR(255)
);

-- Initialize quiz_options table
CREATE TABLE IF NOT EXISTS quiz_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_key VARCHAR(10) NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE
);

-- Initialize training_records table
CREATE TABLE IF NOT EXISTS training_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  exercise_type VARCHAR(100) NOT NULL,
  reps INTEGER,
  duration_seconds INTEGER,
  is_valid BOOLEAN DEFAULT TRUE
);



