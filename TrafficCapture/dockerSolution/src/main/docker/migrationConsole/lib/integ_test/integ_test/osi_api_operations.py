import boto3
import logging

logger = logging.getLogger(__name__)


def get_vpc_by_name(ec2_client, vpc_name):
    response = ec2_client.describe_vpcs(
        Filters=[
            {
                'Name': 'tag:Name',
                'Values': [vpc_name]
            }
        ]
    )
    vpcs = response['Vpcs']
    if not vpcs:
        print(f"No VPC found with the name {vpc_name}")
        return None
    return vpcs[0]['VpcId']


def get_private_subnets(ec2_client, vpc_id):
    response = ec2_client.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
    subnets = response['Subnets']

    private_subnets = []

    for subnet in subnets:
        response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}])
        for route_table in response['RouteTables']:
            for route in route_table['Routes']:
                if route.get('NatGatewayId'):
                    private_subnets.append(subnet['SubnetId'])
                    break  # No need to check other route tables for this subnet
                else:
                    continue  # Only executed if the inner loop did NOT break
            break  # No need to check other route tables for this subnet
    return private_subnets


def get_security_group_id(ec2_client, name_prefix: str, vpc_id: str):
    filters = [{'Name': 'vpc-id', 'Values': [vpc_id]}]
    response = ec2_client.describe_security_groups(Filters=filters)

    security_groups = response['SecurityGroups']
    for sg in security_groups:
        if sg['GroupName'].startswith(name_prefix):
            return sg['GroupId']
    return None


def create_osi_pipeline(ec2_client, stage: str, region: str):
    vpc_name = f"opensearch-network-stack-ec2-source-{stage}/opensearchClusterVpc"
    vpc_id = get_vpc_by_name(ec2_client=ec2_client, vpc_name=vpc_name)
    assert vpc_id is not None
    private_subnets = get_private_subnets(ec2_client=ec2_client, vpc_id=vpc_id)
    cluster_access_sg_id = get_security_group_id(ec2_client=ec2_client,
                                                 name_prefix=f"OSMigrations-{stage}-{region}-default-NetworkInfra-"
                                                             f"osClusterAccess",
                                                 vpc_id=vpc_id)
    assert cluster_access_sg_id is not None
    service_sg_id = get_security_group_id(ec2_client=ec2_client,
                                          name_prefix=f"OSMigrations-{stage}-{region}-MigrationInfra-"
                                                      f"serviceSecurityGroup",
                                          vpc_id=vpc_id)
    assert service_sg_id is not None
    security_groups = [cluster_access_sg_id, service_sg_id]
    request_body = {

    }

