#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {StackComposer} from "../lib/stack-composer";

const app = new cdk.App();
const stage = "dev"
const account = process.env.CDK_DEFAULT_ACCOUNT
const region = process.env.CDK_DEFAULT_REGION
new StackComposer(app, {
    env: { account: account, region: region },
    stackName: `OpenSearchServiceDomainCDKStack-${stage}-${region}`,
    description: "This stack contains resources to create/manage an OpenSearch Service domain"
});