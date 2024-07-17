// Note:
// 1. We are using an existing common VPC that we provide through manually created 'VPC_ID' parameter on the pipeline for now until we move
//    to a proper Jenkins accounts and can create a setup without public subnets as well as request an extension to allow more than 5 VPCs per region
// 2. There is a still a manual step needed on the EC2 source load balancer to replace its security group rule which allows all traffic (0.0.0.0/0) to
//    allow traffic for the relevant service security group. This needs a better story around accepting user security groups in our Migration CDK.

def sourceContextId = 'source-single-node-ec2'
def migrationContextId = 'migration-osi'
// These default values should only be used on the initial Jenkins run in order to load parameter options into the UI,
// all future runs should use the specified parameters
def gitBranch = params.GIT_BRANCH ?: 'main'
def gitUrl = params.GIT_REPO_URL ?: 'https://github.com/opensearch-project/opensearch-migrations.git'
def vpcId = params.VPC_ID
def source_cdk_context = """
    {
      "source-single-node-ec2": {
        "suffix": "ec2-source-<STAGE>",
        "networkStackSuffix": "ec2-source-<STAGE>",
        "vpcId": "$vpcId",
        "distVersion": "7.10.2",
        "distributionUrl": "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-oss-7.10.2-linux-x86_64.tar.gz",
        "captureProxyEnabled": false,
        "securityDisabled": true,
        "minDistribution": false,
        "cpuArch": "x64",
        "isInternal": true,
        "singleNodeCluster": true,
        "networkAvailabilityZones": 2,
        "dataNodeCount": 1,
        "managerNodeCount": 0,
        "serverAccessType": "ipv4",
        "restrictServerAccessTo": "0.0.0.0/0"
      }
    }
"""
def migration_cdk_context = """
    {
      "migration-osi": {
        "stage": "<STAGE>",
        "vpcId": "$vpcId",
        "engineVersion": "OS_2.11",
        "domainName": "os-cluster-<STAGE>",
        "dataNodeCount": 2,
        "openAccessPolicyEnabled": true,
        "domainRemovalPolicy": "DESTROY",
        "artifactBucketRemovalPolicy": "DESTROY",
        "kafkaBrokerServiceEnabled": true,
        "trafficReplayerServiceEnabled": false,
        "migrationConsoleEnableOSI": true,
        "migrationAPIEnabled": true
        "sourceClusterEndpoint": "<SOURCE_CLUSTER_ENDPOINT>"
      }
    }
"""

library identifier: "migrations-lib@${gitBranch}", retriever: modernSCM(
        [$class: 'GitSCMSource',
         remote: "${gitUrl}"])

defaultIntegPipeline(
        sourceContext: source_cdk_context,
        migrationContext: migration_cdk_context,
        sourceContextId: sourceContextId,
        migrationContextId: migrationContextId,
        defaultStageId: 'osi-integ',
        skipCaptureProxyOnNodeSetup: true,
        integTestStep: {
            def time = new Date().getTime()
            def uniqueId = "integ_min_${time}_${currentBuild.number}"
            def test_dir = "/root/lib/integ_test/integ_test"
            def test_result_file = "${test_dir}/reports/${uniqueId}/report.xml"
            def command = "pytest --log-file=${test_dir}/reports/${uniqueId}/pytest.log " +
                    "--junitxml=${test_result_file} ${test_dir}/backfill_tests.py " +
                    "--unique_id ${uniqueId} " +
                    "-s"
            sh "sudo ./awsRunIntegTests.sh --command '${command}' " +
                    "--test-result-file ${test_result_file} " +
                    "--stage ${params.STAGE}"
        }
)
