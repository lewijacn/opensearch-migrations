import {StackPropsExt} from "./stack-composer";
import {IVpc, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {Cluster, CpuArchitecture, PortMapping, Protocol} from "aws-cdk-lib/aws-ecs";
import {Construct} from "constructs";
import {join} from "path";
import {MigrationServiceCore} from "./migration-service-core";


export interface OtelProps extends StackPropsExt {
    readonly fargateCpuArch: CpuArchitecture
}


export class OtelStack extends MigrationServiceCore {

    constructor(scope: Construct, id: string, props: OtelProps) {
        super(scope, id, props)

        const vpc = Vpc.fromLookup(this, 'domainVPC', {
            vpcId: "vpc-0a7dfab75dc83a332",
        });

        const ecsCluster = new Cluster(this, 'testECSCluster', {
            vpc: vpc,
            clusterName: `migration-test-ecs-cluster`
        })


        this.createService({
            vpc: vpc,
            serviceName: "otel",
            dockerDirectoryPath: join(__dirname, "../../../../", "TrafficCapture/dockerSolution/src/main/docker/otelCollector"),
            securityGroups: [SecurityGroup.fromSecurityGroupId(this, "defaultSG", "sg-0bb022d96f6908621")],
            cpuArchitecture: props.fargateCpuArch,
            taskCpuUnits: 512,
            taskMemoryLimitMiB: 2048,
            ...props
        });
    }

}