import { Construct } from 'constructs';
import { EbsDeviceVolumeType } from "aws-cdk-lib/aws-ec2";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import {Stack, StackProps} from "aws-cdk-lib";


export interface opensearchServiceDomainCdkProps extends StackProps{
  readonly version: EngineVersion,
  readonly domainName?: string,
  readonly dataNodeInstanceType?: string,
  readonly dataNodes?: number,
  readonly masterNodeInstanceType?: string,
  readonly masterNodes?: number,
  readonly warmInstanceType?: string,
  readonly warmNodes?: number
}


export class OpensearchServiceDomainCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: opensearchServiceDomainCdkProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const domain = new Domain(this, 'Domain', {
      version: props.version,
      domainName: props.domainName,
      capacity: {
        dataNodeInstanceType: props.dataNodeInstanceType,
        dataNodes: props.dataNodes,
        masterNodeInstanceType: props.masterNodeInstanceType,
        masterNodes: props.masterNodes,
        warmInstanceType: props.warmInstanceType,
        warmNodes: props.warmNodes
      }
    });
  }
}
