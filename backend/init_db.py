"""
Script to initialize the database and run migrations.
Run this script to set up the long-term memory database.
"""

import asyncio
import logging
from database.connection import init_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Initialize the database."""
    try:
        logger.info("Initializing database...")
        await init_database()
        logger.info("Database initialization completed successfully!")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
