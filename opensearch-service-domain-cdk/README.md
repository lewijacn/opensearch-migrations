# OpenSearch Service Domain CDK

### Getting Started

### Deploying your Domain Stack
Before deploying your Domain stack you should fill in any desired context parameters that will dictate the composition
of your OpenSearch Service Domain

This can be accomplished by simply filling in the values in the `cdk.context.json`

As well as by passing these context options as options in the CDK CLI
```
cdk deploy --c domainName='cdk-os-service-domain' --c engineVersion='OS_1_3_6' --c dataNodeType='r6g.large.search' --c dataNodeCount=1
```
* Note that these context parameters can also be passed to `cdk synth` and `cdk bootstrap` commands

### Useful CDK commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
