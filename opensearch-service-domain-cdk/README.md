# OpenSearch Service Domain CDK

### Getting Started

If this is your first time using CDK in this region, will need to `cdk bootstrap` to setup required CDK resources for deployment

Also ensure you have configured the desired [AWS credentials](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites), as these will dictate the region and account used for deployment

### Deploying your Domain Stack
Before deploying your Domain stack you should fill in any desired context parameters that will dictate the composition
of your OpenSearch Service Domain

This can be accomplished by simply filling in the values in the `cdk.context.json`

As well as by passing these context options as options in the CDK CLI
```
cdk deploy --c domainName='cdk-os-service-domain' --c engineVersion="OS_1_3_6" --c dataNodeType="r6g.large.search" --c dataNodeCount=1
```
* Note that these context parameters can also be passed to `cdk synth` and `cdk bootstrap` commands


### Configuration Options

The available configuration options are listed below. The vast majority of these options do not need to be provided, with only `domainName` and `engineVersion` being required.
All non-required options can be removed from the `cdk.context.json` (or not passed by the CLI) or provided as an empty string `""`, in each of these cases the option will be allocated with the CDK Domain default value

Additional context on some of these options, can also be found in the Domain construct [documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_opensearchservice.Domain.html)

**It should be noted that limited testing has been conducted solely in the us-east-1 region, and some items like instance-type might be biased**

| Name                               | Required | Type   | Example                                                                     | Description                                   |
|------------------------------------|----------|--------|-----------------------------------------------------------------------------|:----------------------------------------------|
| domainName                         | true     | string | cdk-os-service-domain                                                       | Name to use for the OpenSearch Service Domain |                                                                                                                                                                                                     

#### Future options
These options are not currently achievable by the CDK Domain construct alone, although possible through CloudFormation or the AWS SDK, and are planned to be added to this code base
```
"coldStorageEnabled": "X",
"anonymousAuthEnabled": "X",
"anonymousAuthDisableDate": "X",
"samlEnabled": "X",
"samlIdentityProviderEntityId": "X",
"samlIdentityProviderMetadataContent": "X",
"samlMasterBackendRole": "X",
"samlMasterUserName": "X",
"samlRolesKey": "X",
"samlSessionTimeoutMinutes": "X",
"samlSubjectKey": "X",
"ebsThroughput": "X",
"tags": "X",
```


Some configuration options (listed below) which enable/disable specific features do not exist in the current native CDK Domain construct. These options are inferred based on the presence or absence of related fields (i.e. if dedicatedMasterNodeCount is set to 1 it is 
inferred that dedicated master nodes should be enabled). These options are normally disabled by default, allowing for this inference.
```
"dedicatedMasterNodeEnabled": "X",
"warmNodeEnabled": "X",
"fineGrainedAccessControlEnabled": "X",
"internalUserDatabaseEnabled": "X",
"cognitoEnabled": "X",
"customEndpointEnabled": "X",
```
### Useful CDK commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
