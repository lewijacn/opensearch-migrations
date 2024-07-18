# conftest.py
import pytest
import uuid
import logging


def pytest_configure(config):
    # Configure logging
    logging.basicConfig(level=logging.DEBUG,
                        format='%(asctime)s - %(levelname)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')

    # This line ensures that log messages are displayed on the console during test runs
    logging.getLogger().setLevel(logging.INFO)


def pytest_addoption(parser):
    parser.addoption("--unique_id", action="store", default=uuid.uuid4().hex)
    parser.addoption("--config_file_path", action="store", default="/etc/migration_services.yaml",
                     help="Path to config file for console library")
    parser.addoption("--stage", action="store", default="aws-integ", help="AWS deployment stage")
    parser.addoption("--region", action="store", default="us-east-1", help="AWS region")


@pytest.fixture
def unique_id(pytestconfig):
    return pytestconfig.getoption("unique_id")
