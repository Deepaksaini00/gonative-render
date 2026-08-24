from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.database.migration import MigrationFunction


async def m001_initial_tables(conn: AsyncConnection) -> None:
    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY,
                name            VARCHAR NOT NULL,
                email           VARCHAR NOT NULL UNIQUE,
                hashed_password VARCHAR NOT NULL,
                native_language VARCHAR DEFAULT 'hindi',
                target_language VARCHAR DEFAULT 'english',
                is_active       BOOLEAN DEFAULT 1,
                created_at      DATETIME,
                last_login      DATETIME,
                current_streak  INTEGER DEFAULT 0,
                total_xp        INTEGER DEFAULT 0
            )
            """
        )
    )

    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS lessons (
                id            INTEGER PRIMARY KEY,
                title         VARCHAR NOT NULL,
                title_hindi   VARCHAR,
                description   TEXT,
                level         INTEGER DEFAULT 1,
                order_index   INTEGER DEFAULT 0,
                category      VARCHAR DEFAULT 'general',
                content       JSON,
                is_generated  BOOLEAN DEFAULT 0,
                created_at    DATETIME
            )
            """
        )
    )

    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id               INTEGER PRIMARY KEY,
                lesson_id        INTEGER NOT NULL REFERENCES lessons(id),
                question_text    TEXT NOT NULL,
                question_hindi   TEXT,
                question_type    VARCHAR DEFAULT 'mcq',
                options          JSON,
                correct_answer   VARCHAR NOT NULL,
                explanation      TEXT,
                explanation_hindi TEXT
            )
            """
        )
    )

    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_progress (
                id             INTEGER PRIMARY KEY,
                user_id        INTEGER NOT NULL REFERENCES users(id),
                lesson_id      INTEGER NOT NULL REFERENCES lessons(id),
                status         VARCHAR DEFAULT 'not_started',
                score          FLOAT DEFAULT 0.0,
                attempts       INTEGER DEFAULT 0,
                last_attempted DATETIME,
                completed_at   DATETIME,
                xp_earned      INTEGER DEFAULT 0
            )
            """
        )
    )

    await conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id                  INTEGER PRIMARY KEY,
                user_id             INTEGER NOT NULL REFERENCES users(id),
                lesson_id           INTEGER NOT NULL REFERENCES lessons(id),
                attempt_type        VARCHAR DEFAULT 'lesson',
                answers             JSON,
                score               FLOAT DEFAULT 0.0,
                total_questions     INTEGER DEFAULT 0,
                correct_answers     INTEGER DEFAULT 0,
                time_taken_seconds  INTEGER DEFAULT 0,
                ai_feedback         TEXT,
                created_at          DATETIME
            )
            """
        )
    )


# Future migrations added here as new functions:
# async def m002_add_user_field(conn: AsyncConnection) -> None:
#     await conn.execute(text("ALTER TABLE users ADD COLUMN username TEXT"))


MIGRATIONS: list[MigrationFunction] = [
    m001_initial_tables,
]