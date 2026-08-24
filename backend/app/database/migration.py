from datetime import datetime, timezone
from typing import Awaitable, Callable

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

MIGRATION_TABLE_NAME = "migration_version"

MigrationFunction = Callable[[AsyncConnection], Awaitable[None]]


async def apply_migrations(
    conn: AsyncConnection, migrations: list[MigrationFunction]
) -> None:
    await conn.execute(
        text(
            f"""
            CREATE TABLE IF NOT EXISTS {MIGRATION_TABLE_NAME} (
                version INTEGER PRIMARY KEY,
                applied_on TEXT NOT NULL
            )
            """
        )
    )

    result = await conn.execute(
        text(f"SELECT count(*) AS count FROM {MIGRATION_TABLE_NAME}")
    )
    count: int = result.scalar_one()

    if count > len(migrations):
        raise Exception(
            "Database has newer migrations than your code. "
            "Please deploy a newer version."
        )

    for i, migration in enumerate(migrations[count:]):
        await migration(conn)
        await conn.execute(
            text(
                f"""
                INSERT INTO {MIGRATION_TABLE_NAME} (version, applied_on)
                VALUES (:version, :applied_on)
                """
            ),
            {
                "version": count + i + 1,
                "applied_on": datetime.now(timezone.utc).isoformat(),
            },
        )