import { Construct } from 'constructs';
import {
  EbsDeviceVolumeType,
  ISecurityGroup,
  ISubnet,
  IVpc,
  SecurityGroup,
  Subnet,
  SubnetSelection,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import {Domain, EngineVersion, TLSSecurityPolicy} from "aws-cdk-lib/aws-opensearchservice";
import {RemovalPolicy, SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {IKey, Key} from "aws-cdk-lib/aws-kms";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";
import {ILogGroup, LogGroup} from "aws-cdk-lib/aws-logs";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";


export interface opensearchServiceDomainCdkProps extends StackProps{
  readonly version: EngineVersion,
  readonly domainName: string,
  readonly advancedOptions?: { [key: string]: (string) },
  readonly accessPolicies?: PolicyStatement[],
  readonly useUnsignedBasicAuth?: boolean,
  readonly dataNodeInstanceType?: string,
  readonly dataNodes?: number,
  readonly dedicatedManagerNodeType?: string,
  readonly dedicatedManagerNodeCount?: number,
  readonly warmInstanceType?: string,
  readonly warmNodes?: number
  readonly zoneAwarenessEnabled?: boolean,
  readonly zoneAwarenessAvailabilityZoneCount?: number,
  readonly fineGrainedManagerUserARN?: string,
  readonly fineGrainedManagerUserName?: string,
  readonly fineGrainedManagerUserSecretManagerKeyARN?: string,
  readonly nodeToNodeEncryptionEnabled?: boolean,
  readonly encryptionAtRestEnabled?: boolean,
  readonly encryptionAtRestKmsKeyARN?: string,
  readonly enforceHTTPS?: boolean,
  readonly tlsSecurityPolicy?: TLSSecurityPolicy,
  readonly ebsEnabled?: boolean,
  readonly ebsIops?: number,
  readonly ebsVolumeSize?: number,
  readonly ebsVolumeType?: EbsDeviceVolumeType,
  readonly appLogEnabled?: boolean,
  readonly appLogGroup?: string,
  readonly auditLogEnabled?: boolean,
  readonly auditLogGroup?: string,
  readonly slowIndexLogEnabled?: boolean,
  readonly slowIndexLogGroup?: string,
  readonly slowSearchLogEnabled?: boolean,
  readonly slowSearchLogGroup?: string,
  readonly snapshotAutomatedStartHour?: number,
  readonly vpcId?: string,
  readonly vpcSubnetIds?: string[],
  readonly vpcSecurityGroupIds?: string[],
  readonly domainRemovalPolicy?: RemovalPolicy
}


export class OpensearchServiceDomainCdkStack extends Stack {
  constructor(scope: Construct, id: string, props: opensearchServiceDomainCdkProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // Retrieve existing account resources if defined
    const earKmsKey: IKey|undefined = props.encryptionAtRestKmsKeyARN && props.encryptionAtRestEnabled ?
        Key.fromKeyArn(this, "earKey", props.encryptionAtRestKmsKeyARN) : undefined

    const managerUserSecret: SecretValue|undefined = props.fineGrainedManagerUserSecretManagerKeyARN ?
        Secret.fromSecretCompleteArn(this, "managerSecret", props.fineGrainedManagerUserSecretManagerKeyARN).secretValue : undefined

    const appLG: ILogGroup|undefined = props.appLogGroup && props.appLogEnabled ?
        LogGroup.fromLogGroupArn(this, "appLogGroup", props.appLogGroup) : undefined

    const auditLG: ILogGroup|undefined = props.auditLogGroup && props.auditLogEnabled ?
        LogGroup.fromLogGroupArn(this, "auditLogGroup", props.auditLogGroup) : undefined

    const slowIndexLG: ILogGroup|undefined = props.slowIndexLogGroup && props.slowIndexLogEnabled ?
        LogGroup.fromLogGroupArn(this, "slowIndexLogGroup", props.slowIndexLogGroup) : undefined

    const slowSearchLG: ILogGroup|undefined = props.slowSearchLogGroup && props.slowSearchLogEnabled ?
        LogGroup.fromLogGroupArn(this, "slowSearchLogGroup", props.slowSearchLogGroup) : undefined

    const vpc: IVpc|undefined = props.vpcId ?
        Vpc.fromLookup(this, "domainVPC", {vpcId: props.vpcId}) : undefined

    let vpcSubnets: SubnetSelection[]|undefined = undefined
    if (props.vpcSubnetIds && vpc) {
      const subnetIds = props.vpcSubnetIds
      let subnetArray: ISubnet[] = []
      for (let i = 0; i < subnetIds.length; i++) {
        subnetArray.push(Subnet.fromSubnetId(this, "subnet-" + i, subnetIds[i]))
      }
      const vpcSubnet = {subnets: subnetArray}
      vpcSubnets = [vpcSubnet]
    }

    let vpcSecurityGroups: ISecurityGroup[]|undefined = undefined
    if (props.vpcSecurityGroupIds && vpc) {
      const securityGroupIds = props.vpcSecurityGroupIds
      let securityGroupArray: ISecurityGroup[] = []
      for (let i = 0; i < securityGroupIds.length; i++) {
        securityGroupArray.push(SecurityGroup.fromLookupById(this, "security-group-" + i, securityGroupIds[i]))
      }
      vpcSecurityGroups = securityGroupArray
    }

    const domain = new Domain(this, 'Domain', {
      version: props.version,
      domainName: props.domainName,
      advancedOptions: props.advancedOptions,
      accessPolicies: props.accessPolicies,
      useUnsignedBasicAuth: props.useUnsignedBasicAuth,
      capacity: {
        dataNodeInstanceType: props.dataNodeInstanceType,
        dataNodes: props.dataNodes,
        masterNodeInstanceType: props.dedicatedManagerNodeType,
        masterNodes: props.dedicatedManagerNodeCount,
        warmInstanceType: props.warmInstanceType,
        warmNodes: props.warmNodes
      },
      zoneAwareness: {
        enabled: props.zoneAwarenessEnabled,
        availabilityZoneCount: props.zoneAwarenessAvailabilityZoneCount
      },
      fineGrainedAccessControl: {
        masterUserArn: props.fineGrainedManagerUserARN,
        masterUserName: props.fineGrainedManagerUserName,
        masterUserPassword: managerUserSecret
      },
      nodeToNodeEncryption: props.nodeToNodeEncryptionEnabled,
      encryptionAtRest: {
        enabled: props.encryptionAtRestEnabled,
        kmsKey: earKmsKey
      },
      enforceHttps: props.enforceHTTPS,
      tlsSecurityPolicy: props.tlsSecurityPolicy,
      ebs: {
        enabled: props.ebsEnabled,
        iops: props.ebsIops,
        volumeSize: props.ebsVolumeSize,
        volumeType: props.ebsVolumeType
      },
      automatedSnapshotStartHour: props.snapshotAutomatedStartHour,
      logging: {
        appLogEnabled: props.appLogEnabled,
        appLogGroup: appLG,
        auditLogEnabled: props.auditLogEnabled,
        auditLogGroup: auditLG,
        slowIndexLogEnabled: props.slowIndexLogEnabled,
        slowIndexLogGroup: slowIndexLG,
        slowSearchLogEnabled: props.slowSearchLogEnabled,
        slowSearchLogGroup: slowSearchLG
      },
      vpc: vpc,
      vpcSubnets: vpcSubnets,
      securityGroups: vpcSecurityGroups,
      removalPolicy: props.domainRemovalPolicy
    });
  }
}
