import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log(message: str):
    logger.info(message)

