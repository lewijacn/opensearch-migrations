// Note:
// 1. We are using an existing common VPC for now until we move to a proper Jenkins accounts and can create a setup without
//    public subnets as well as request an extension to allow more than 5 VPCs per region
// 2. There is a still a manual step needed on the EC2 source load balancer to replace its security group rule which allows all traffic (0.0.0.0/0) to
//    allow traffic for the relevant service security group. This needs a better story around accepting user security groups in our Migration CDK.

def call(Map config = [:]) {
    def source_cdk_context = """
    {
      "source-single-node-ec2": {
        "suffix": "ec2-source-<STAGE>",
        "networkStackSuffix": "ec2-source-<STAGE>",
        "vpcId": "vpc-07d3e089b8e9139e4",
        "distVersion": "7.10.2",
        "cidr": "12.0.0.0/16",
        "distributionUrl": "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-oss-7.10.2-linux-x86_64.tar.gz",
        "captureProxyEnabled": true,
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
      "migration-default": {
        "stage": "<STAGE>",
        "vpcId": "vpc-07d3e089b8e9139e4",
        "engineVersion": "OS_2.11",
        "domainName": "os-cluster-<STAGE>",
        "dataNodeCount": 2,
        "openAccessPolicyEnabled": true,
        "domainRemovalPolicy": "DESTROY",
        "artifactBucketRemovalPolicy": "DESTROY",
        "trafficReplayerExtraArgs": "--speedup-factor 10.0",
        "fetchMigrationEnabled": true,
        "reindexFromSnapshotServiceEnabled": true,
        "sourceClusterEndpoint": "<SOURCE_CLUSTER_ENDPOINT>",
        "dpPipelineTemplatePath": "../../../test/dp_pipeline_aws_integ.yaml",
        "migrationConsoleEnableOSI": true,
        "migrationAPIEnabled": true
      }
    }
    """
    def source_context_file_name = 'sourceJenkinsContext.json'
    def migration_context_file_name = 'migrationJenkinsContext.json'
    def gitUrl = config.gitUrl ?: 'https://github.com/opensearch-project/opensearch-migrations.git'
    def gitBranch = config.gitBranch ?: 'main'
    def stage = config.stage ?: 'aws-integ'
    pipeline {
        agent { label config.overrideAgent ?: 'Jenkins-Default-Agent-X64-C5xlarge-Single-Host' }

        stages {
            stage('Checkout') {
                steps {
                    git branch: "${gitBranch}", url: "${gitUrl}"
                }
            }

            stage('Test Caller Identity') {
                steps {
                    sh 'aws sts get-caller-identity'
                }
            }

            stage('Setup E2E CDK Context') {
                steps {
                    writeFile (file: "test/$source_context_file_name", text: source_cdk_context)
                    sh "echo 'Using source context file options: ' && cat test/$source_context_file_name"
                    writeFile (file: "test/$migration_context_file_name", text: migration_cdk_context)
                    sh "echo 'Using migration context file options: ' && cat test/$migration_context_file_name"
                }
            }

            stage('Build') {
                steps {
                    timeout(time: 1, unit: 'HOURS') {
                        sh 'sudo ./gradlew clean build'
                    }
                }
            }

            stage('Deploy') {
                steps {
                    dir('test') {
                        sh 'sudo usermod -aG docker $USER'
                        sh 'sudo newgrp docker'
                        sh "sudo ./awsE2ESolutionSetup.sh --source-context-file './$source_context_file_name' --migration-context-file './$migration_context_file_name' --source-context-id source-single-node-ec2 --migration-context-id migration-default --stage ${stage} --migrations-git-url ${gitUrl} --migrations-git-branch ${gitBranch}"
                    }
                }
            }

            stage('Integ Tests') {
                steps {
                    dir('test') {
                        script {
                            def time = new Date().getTime()
                            def uniqueId = "integ_min_${time}_${currentBuild.number}"
                            sh "sudo ./awsRunIntegTests.sh --stage ${stage} --migrations-git-url ${gitUrl} --migrations-git-branch ${gitBranch} --unique-id ${uniqueId}"
                        }
                    }

                }
            }
        }
        post {
            always {
                dir('test') {
                    sh "sudo ./awsE2ESolutionSetup.sh --stage ${stage} --run-post-actions"
                }
            }
        }
    }
}