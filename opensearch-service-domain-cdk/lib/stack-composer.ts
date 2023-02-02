import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import {OpensearchServiceDomainCdkStack} from "./opensearch-service-domain-cdk-stack";
import {EngineVersion} from "aws-cdk-lib/aws-opensearchservice";

export class StackComposer {

    constructor(scope: Construct, props: StackProps) {

        let version: EngineVersion

        const domainName: string = scope.node.tryGetContext('domainName')
        const dataNodeType: string = scope.node.tryGetContext('dataNodeType')
        const dataNodeCount: number = scope.node.tryGetContext('dataNodeCount')
        const dedicatedMasterNodeType: string = scope.node.tryGetContext('dedicatedMasterNodeType')
        const dedicatedMasterNodeCount: number = scope.node.tryGetContext('dedicatedMasterNodeCount')
        const warmNodeType: string = scope.node.tryGetContext('warmNodeType')
        const warmNodeCount: number = scope.node.tryGetContext('warmNodeCount')

        const engineVersion: string = scope.node.tryGetContext('engineVersion')
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

        const opensearchStack = new OpensearchServiceDomainCdkStack(scope, 'OpenSearchServiceDomainCDKStack', {
            version: version,
            domainName: getValidOrUndef(domainName),
            dataNodeInstanceType: getValidOrUndef(dataNodeType),
            dataNodes: getValidOrUndef(dataNodeCount),
            masterNodeInstanceType: getValidOrUndef(dedicatedMasterNodeType),
            masterNodes: getValidOrUndef(dedicatedMasterNodeCount),
            warmInstanceType: getValidOrUndef(warmNodeType),
            warmNodes: getValidOrUndef(warmNodeCount),
            ...props,
        });

        function getValidOrUndef(value: any):any {
            return !value ? undefined : value
        }
    }
}