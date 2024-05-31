import {Construct} from "constructs";
import {Duration, Stack, StackProps} from "aws-cdk-lib";
import {OtelStack} from "./otel-stack";
import {CpuArchitecture} from "aws-cdk-lib/aws-ecs";

export interface StackPropsExt extends StackProps {
    readonly stage: string,
    readonly defaultDeployId: string,
    readonly addOnMigrationDeployId?: string
}

export interface StackComposerProps extends StackProps {
    readonly migrationsSolutionVersion?: string
    readonly migrationsAppRegistryARN?: string,
    readonly customReplayerUserAgent?: string
}

export class StackComposer {
    public stacks: Stack[] = [];


    constructor(scope: Construct, props: StackComposerProps) {

        const stage = "test"

        let otelStack
        otelStack = new OtelStack(scope, "otel", {
            stackName: `OSMigrations-${stage}-Otel`,
            description: "This stack contains resources for a testing mock Elasticsearch single node cluster ECS service",
            stage: stage,
            defaultDeployId: "default",
            //fargateCpuArch: CpuArchitecture.ARM64,
            //fargateCpuArch: CpuArchitecture.X86_64,
            env: props.env
        })
        this.stacks.push(otelStack)
    }
}