import boto3
import logging
import pytest
import unittest
from http import HTTPStatus
from console_link.middleware.clusters import run_test_benchmarks, connection_check, clear_indices, ConnectionResult
from console_link.models.cluster import Cluster
from console_link.cli import Context
from common_operations import (get_document, create_document, create_index, check_doc_counts_match,
                               EXPECTED_BENCHMARK_DOCS)
from osi_api_operations import create_osi_pipeline

logger = logging.getLogger(__name__)


def preload_data(source_cluster: Cluster):
    # Preload data that test cases will verify is migrated
    # test_osi_api_0001
    index_name = f"test_osi_api_0001_{pytest.unique_id}"
    doc_id = "osi_api_0001_doc"
    create_index(cluster=source_cluster, index_name=index_name)
    create_document(cluster=source_cluster, index_name=index_name, doc_id=doc_id,
                    expected_status_code=HTTPStatus.CREATED)

    # test_osi_api_0002
    #run_test_benchmarks(source_cluster)


@pytest.fixture(scope="class")
def setup_before_tests(request):
    config_path = request.config.getoption("--config_file_path")
    unique_id = request.config.getoption("--unique_id")
    stage = request.config.getoption("--stage")
    region = request.config.getoption("--region")
    pytest.console_env = Context(config_path).env
    pytest.unique_id = unique_id
    source_cluster = pytest.console_env.source_cluster
    target_cluster = pytest.console_env.target_cluster
    # Confirm source and target connection
    source_con_result: ConnectionResult = connection_check(source_cluster)
    assert source_con_result.connection_established is True
    target_con_result: ConnectionResult = connection_check(target_cluster)
    assert target_con_result.connection_established is True

    # Clear any existing non-system indices
    clear_indices(source_cluster)
    clear_indices(target_cluster)

    preload_data(source_cluster=pytest.console_env.source_cluster)

    ec2_client = boto3.client('ec2')
    create_osi_pipeline(ec2_client=ec2_client, stage=stage, region=region)
    exit(1)


@pytest.fixture(scope="session", autouse=True)
def cleanup_after_tests():
    # Setup code
    logger.info("Starting osi api tests...")

    yield

    # Teardown code
    logger.info("Removing OSI Pipeline...")

    # TODO Delete pipeline, may need to stop first


@pytest.mark.usefixtures("setup_before_tests")
class OSIAPITests(unittest.TestCase):

    def test_osi_api_0001_single_document(self):
        index_name = f"test_osi_api_0001_{pytest.unique_id}"
        doc_id = "osi_api_0001_doc"
        source_cluster: Cluster = pytest.console_env.source_cluster
        target_cluster: Cluster = pytest.console_env.target_cluster

        # Assert preloaded document exists
        get_document(cluster=source_cluster, index_name=index_name, doc_id=doc_id, test_case=self)

        # TODO Determine when backfill is completed

        get_document(cluster=target_cluster, index_name=index_name, doc_id=doc_id, max_attempts=30, delay=30.0,
                     test_case=self)

