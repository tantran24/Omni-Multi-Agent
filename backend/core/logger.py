import logging
import sys
from logging.handlers import RotatingFileHandler


def setup_logger(name: str = __name__, level: int = logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        # Console handler with minimal formatting
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
        logger.addHandler(console_handler)

        # File handler with rotation (10MB max file size, keep 5 backup files)
        file_handler = RotatingFileHandler(
            "app.log", maxBytes=10_000_000, backupCount=5
        )
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )
        logger.addHandler(file_handler)

    return logger


logger = setup_logger()


def log(message: str, level: str = "info"):
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(message)
