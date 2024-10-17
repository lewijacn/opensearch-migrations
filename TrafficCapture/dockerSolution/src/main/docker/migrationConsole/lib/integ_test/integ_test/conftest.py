# conftest.py
import pytest
import uuid
import logging


def pytest_configure(config):
    # Configure logging, avoid sensitive data at lower logs levels
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(levelname)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')


def pytest_addoption(parser):
    parser.addoption("--unique_id", action="store", default=uuid.uuid4().hex)
    parser.addoption("--config_file_path", action="store", default="/etc/migration_services.yaml",
                     help="Path to config file for console library")


@pytest.fixture
def unique_id(pytestconfig):
    return pytestconfig.getoption("unique_id")
