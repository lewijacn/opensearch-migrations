import {Construct} from 'constructs';
import {RemovalPolicy, StackProps} from 'aws-cdk-lib';
import {OpensearchServiceDomainCdkStack} from "./opensearch-service-domain-cdk-stack";
import {EngineVersion, TLSSecurityPolicy} from "aws-cdk-lib/aws-opensearchservice";
import {EbsDeviceVolumeType} from "aws-cdk-lib/aws-ec2";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export class StackComposer {

    constructor(scope: Construct, props: StackProps) {

        let version: EngineVersion

        const domainName = getContextForType('domainName', 'string')
        const dataNodeType = getContextForType('dataNodeType', 'string')
        const dataNodeCount = getContextForType('dataNodeCount', 'number')
        const dedicatedManagerNodeType = getContextForType('dedicatedManagerNodeType', 'string')
        const dedicatedManagerNodeCount = getContextForType('dedicatedManagerNodeCount', 'number')
        const warmNodeType = getContextForType('warmNodeType', 'string')
        const warmNodeCount = getContextForType('warmNodeCount', 'number')
        const zoneAwarenessEnabled = getContextForType('zoneAwarenessEnabled', 'boolean')
        const zoneAwarenessAvailabilityZoneCount = getContextForType('zoneAwarenessAvailabilityZoneCount', 'number')
        const advancedOptions = getContextForType('advancedOptions', 'object')
        const useUnsignedBasicAuth = getContextForType('useUnsignedBasicAuth', 'boolean')
        const fineGrainedManagerUserARN = getContextForType('fineGrainedManagerUserARN', 'string')
        const fineGrainedManagerUserName = getContextForType('fineGrainedManagerUserName', 'string')
        const fineGrainedManagerUserSecretManagerKeyARN = getContextForType('fineGrainedManagerUserSecretManagerKeyARN', 'string')
        const enforceHTTPS = getContextForType('enforceHTTPS', 'boolean')
        const noneToNodeEncryptionEnabled = getContextForType('nodeToNodeEncryptionEnabled', 'boolean')
        const encryptionAtRestEnabled = getContextForType('encryptionAtRestEnabled', 'boolean')
        const encryptionAtRestKmsKeyARN = getContextForType("encryptionAtRestKmsKeyARN", 'string')
        const ebsEnabled = getContextForType('ebsEnabled', 'boolean')
        const ebsIops = getContextForType('ebsIops', 'number')
        const ebsVolumeSize = getContextForType('ebsVolumeSize', 'number')
        const loggingAppLogEnabled = getContextForType('loggingAppLogEnabled', 'boolean')
        const loggingAppLogGroupARN = getContextForType('loggingAppLogGroupARN', 'string')
        const loggingAuditLogEnabled = getContextForType('loggingAuditLogEnabled', 'boolean')
        const loggingAuditLogGroupARN = getContextForType('loggingAuditLogGroupARN', 'string')
        const loggingSlowIndexLogEnabled = getContextForType('loggingSlowIndexLogEnabled', 'boolean')
        const loggingSlowIndexLogGroupARN = getContextForType('loggingSlowIndexLogGroupARN', 'string')
        const loggingSlowSearchLogEnabled = getContextForType('loggingSlowSearchLogEnabled', 'boolean')
        const loggingSlowSearchLogGroupARN = getContextForType('loggingSlowSearchLogGroupARN', 'string')
        const snapshotAutomatedStartHour = getContextForType('snapshotAutomatedStartHour', 'number')
        const vpcId = getContextForType('vpcId', 'string')
        const vpcSecurityGroupIds = getContextForType('vpcSecurityGroupIds', 'object')
        const vpcSubnetIds = getContextForType('vpcSubnetIds', 'object')


        const engineVersion = getContextForType('engineVersion', 'string')
        if (engineVersion.startsWith("OS_")) {
            // Will accept a period delimited version string (i.e. 1.3) and return a proper EngineVersion
            version = EngineVersion.openSearch(engineVersion.substring(3))
        }
        else if (engineVersion.startsWith("ES_")) {
            version = EngineVersion.elasticsearch(engineVersion.substring(3))
        }
        else {
            throw new Error("Engine version is not present or does not match the expected format, i.e. OS_1.3 or ES_7.9")
        }

        const accessPolicyJson = getContextForType('accessPolicies', 'object')
        const accessPolicies = accessPolicyJson ? parseAccessPolicies(accessPolicyJson) : undefined

        const tlsSecurityPolicyName = getContextForType('tlsSecurityPolicy', 'string')
        const tlsSecurityPolicy: TLSSecurityPolicy|undefined = tlsSecurityPolicyName ? TLSSecurityPolicy[tlsSecurityPolicyName as keyof typeof TLSSecurityPolicy] : undefined
        if (tlsSecurityPolicyName && !tlsSecurityPolicy) {
            throw new Error("Provided tlsSecurityPolicy does not match a selectable option, for reference https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_opensearchservice.TLSSecurityPolicy.html")
        }

        const ebsVolumeTypeName = getContextForType('ebsVolumeType', 'string')
        const ebsVolumeType: EbsDeviceVolumeType|undefined = ebsVolumeTypeName ? EbsDeviceVolumeType[ebsVolumeTypeName as keyof typeof EbsDeviceVolumeType] : undefined
        if (ebsVolumeTypeName && !ebsVolumeType) {
            throw new Error("Provided ebsVolumeType does not match a selectable option, for reference https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.EbsDeviceVolumeType.html")
        }

        const domainRemovalPolicyName = getContextForType('domainRemovalPolicy', 'string')
        const domainRemovalPolicy = domainRemovalPolicyName ? RemovalPolicy[domainRemovalPolicyName as keyof typeof RemovalPolicy] : undefined
        if (domainRemovalPolicyName && !domainRemovalPolicy) {
            throw new Error("Provided domainRemovalPolicy does not match a selectable option, for reference https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.RemovalPolicy.html")
        }

        const opensearchStack = new OpensearchServiceDomainCdkStack(scope, 'opensearchDomainStack', {
            version: version,
            domainName: domainName,
            advancedOptions: advancedOptions,
            accessPolicies: accessPolicies,
            dataNodeInstanceType: dataNodeType,
            dataNodes: dataNodeCount,
            dedicatedManagerNodeType: dedicatedManagerNodeType,
            dedicatedManagerNodeCount: dedicatedManagerNodeCount,
            warmInstanceType: warmNodeType,
            warmNodes: warmNodeCount,
            zoneAwarenessEnabled: zoneAwarenessEnabled,
            zoneAwarenessAvailabilityZoneCount: zoneAwarenessAvailabilityZoneCount,
            useUnsignedBasicAuth: useUnsignedBasicAuth,
            fineGrainedManagerUserARN: fineGrainedManagerUserARN,
            fineGrainedManagerUserName: fineGrainedManagerUserName,
            fineGrainedManagerUserSecretManagerKeyARN: fineGrainedManagerUserSecretManagerKeyARN,
            enforceHTTPS: enforceHTTPS,
            tlsSecurityPolicy: tlsSecurityPolicy,
            nodeToNodeEncryptionEnabled: noneToNodeEncryptionEnabled,
            encryptionAtRestEnabled: encryptionAtRestEnabled,
            encryptionAtRestKmsKeyARN: encryptionAtRestKmsKeyARN,
            ebsEnabled: ebsEnabled,
            ebsIops: ebsIops,
            ebsVolumeSize: ebsVolumeSize,
            ebsVolumeType: ebsVolumeType,
            appLogEnabled: loggingAppLogEnabled,
            appLogGroup: loggingAppLogGroupARN,
            auditLogEnabled: loggingAuditLogEnabled,
            auditLogGroup: loggingAuditLogGroupARN,
            slowIndexLogEnabled: loggingSlowIndexLogEnabled,
            slowIndexLogGroup: loggingSlowIndexLogGroupARN,
            slowSearchLogEnabled: loggingSlowSearchLogEnabled,
            slowSearchLogGroup: loggingSlowSearchLogGroupARN,
            snapshotAutomatedStartHour: snapshotAutomatedStartHour,
            vpcId: vpcId,
            vpcSecurityGroupIds: vpcSecurityGroupIds,
            vpcSubnetIds: vpcSubnetIds,
            domainRemovalPolicy: domainRemovalPolicy,
            ...props,
        });

        function getContextForType(optionName: string, expectedType: string): any {
            const option = scope.node.tryGetContext(optionName)
            // Filter out invalid or missing options by setting undefined (empty strings, null, undefined, NaN)
            if (option !== false && option !== 0 && !option) {
                return undefined
            }
            // Values provided by the CLI will always be represented as a string and need to be parsed
            if (typeof option === 'string') {
                if (expectedType === 'number') {
                    return parseInt(option)
                }
                if (expectedType === 'boolean' || expectedType === 'object') {
                    return JSON.parse(option)
                }
            }
            // Values provided by the cdk.context.json should be of the desired type
            if (typeof option !== expectedType) {
                throw new Error(`Type provided by cdk.context.json for ${optionName} was ${typeof option} but expected ${expectedType}`)
            }
            return option
        }

        function parseAccessPolicies(jsonObject: { [x: string]: any; }): PolicyStatement[] {
            let accessPolicies: PolicyStatement[] = []
            const statements = jsonObject['Statement']
            for (let i = 0; i < statements.length; i++) {
                const statement = PolicyStatement.fromJson(statements[i])
                accessPolicies.push(statement)
            }
            return accessPolicies
        }
        
    }
}