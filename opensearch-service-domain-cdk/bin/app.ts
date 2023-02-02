#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {StackComposer} from "../lib/stack-composer";

const app = new cdk.App();
new StackComposer(app, {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    description: "This stack contains resources to create/manage an OpenSearch Service domain"
});