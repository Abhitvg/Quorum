import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parameterized values — override via cdk.json context or --context flags
    const dbHost = this.node.tryGetContext('databaseHost') || 'database-1.cluster-cvs68yyk49gx.eu-north-1.rds.amazonaws.com';
    const livekitUrl = this.node.tryGetContext('livekitUrl') || 'wss://quorum-oor689rg.livekit.cloud';
    const domainName = this.node.tryGetContext('domainName') || 'quorum.atma-ai.co.in';
    const apiDomainName = this.node.tryGetContext('apiDomainName') || `api.${domainName}`;
    const dbResourceId = this.node.tryGetContext('dbResourceId') || 'cluster-cvs68yyk49gx';

    // =========================================================================
    // 1. VPC — Public and Private subnets (preserved from ECS setup)
    // =========================================================================
    const vpc = new ec2.Vpc(this, 'QuorumVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // =========================================================================
    // 2. ElastiCache Redis — in private subnets (preserved from ECS setup)
    // =========================================================================
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Quorum Redis',
      allowAllOutbound: true,
    });

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnets for Quorum Redis',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'QuorumRedis', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
    });

    // =========================================================================
    // 3. Secrets Manager (preserved from ECS setup)
    // =========================================================================
    const secret = new secretsmanager.Secret(this, 'QuorumSecrets', {
      secretName: 'quorum-prod-secrets',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          LIVEKIT_API_KEY: '',
          LIVEKIT_API_SECRET: '',
          S3_ACCESS_KEY_ID: '',
          S3_SECRET_ACCESS_KEY: '',
        }),
        generateStringKey: 'JWT_SECRET',
        excludePunctuation: true,
      },
    });

    new cdk.CfnOutput(this, 'SecretUpdateReminder', {
      value: secret.secretName,
      description: 'Update LIVEKIT_API_KEY and other credentials in this Secrets Manager secret via AWS Console',
    });

    // =========================================================================
    // 4. ACM Certificate ARN (provided via context to avoid blocking DNS validation)
    // =========================================================================
    // To create the certificate manually:
    //   aws acm request-certificate --domain-name api.quorum.atma-ai.co.in \
    //     --subject-alternative-names quorum.atma-ai.co.in '*.quorum.atma-ai.co.in' \
    //     --validation-method DNS
    // Then add the CNAME records to your DNS provider and pass the ARN via context.
    const certificateArn = this.node.tryGetContext('certificateArn') || 'pending';

    // =========================================================================
    // 5. ECR Repositories — Container image storage
    // =========================================================================
    const apiRepo = new ecr.Repository(this, 'QuorumApiRepo', {
      repositoryName: 'quorum-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 most recent images',
        },
      ],
    });

    const webRepo = new ecr.Repository(this, 'QuorumWebRepo', {
      repositoryName: 'quorum-web',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 most recent images',
        },
      ],
    });

    const agentRepo = new ecr.Repository(this, 'QuorumAgentRepo', {
      repositoryName: 'quorum-agent',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 most recent images',
        },
      ],
    });

    // =========================================================================
    // 6. EKS Cluster
    // =========================================================================
    const clusterAdmin = new iam.Role(this, 'QuorumClusterAdminRole', {
      assumedBy: new iam.AccountRootPrincipal(),
      description: 'Admin role for Quorum EKS cluster management',
    });

    const cluster = new eks.Cluster(this, 'QuorumCluster', {
      clusterName: 'QuorumCluster',
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0, // We'll add managed node groups explicitly
      version: eks.KubernetesVersion.V1_30,
      kubectlLayer: new KubectlV30Layer(this, 'kubectl'),
      mastersRole: clusterAdmin,
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
    });

    // =========================================================================
    // 7. Managed Node Group — worker nodes for running pods
    // =========================================================================
    const userData = new ec2.MultipartUserData();
    userData.addPart(ec2.MultipartBody.fromRawBody({
      contentType: 'text/x-shellscript; charset="us-ascii"',
      body: `#!/bin/bash
set -ex
B64_CLUSTER_CA=$(aws eks describe-cluster --name QuorumCluster --region eu-north-1 --query "cluster.certificateAuthority.data" --output text)
API_SERVER_URL=$(aws eks describe-cluster --name QuorumCluster --region eu-north-1 --query "cluster.endpoint" --output text)
/etc/eks/bootstrap.sh QuorumCluster --b64-cluster-ca $B64_CLUSTER_CA --apiserver-endpoint $API_SERVER_URL --use-max-pods false --kubelet-extra-args "--max-pods=11"`,
    }));

    const nodeLaunchTemplate = new ec2.LaunchTemplate(this, 'QuorumNodeLaunchTemplate', {
      userData,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20),
      }],
    });

    const nodeGroup = cluster.addNodegroupCapacity('QuorumNodeGroup', {
      instanceTypes: [
        new ec2.InstanceType('t3.micro'),
      ],
      minSize: 2,
      maxSize: 3,
      desiredSize: 2,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      launchTemplateSpec: {
        id: nodeLaunchTemplate.launchTemplateId!,
        version: nodeLaunchTemplate.latestVersionNumber,
      },
      labels: {
        'node-role': 'workload',
        'project': 'quorum',
      },
      tags: {
        'Environment': 'production',
        'Project': 'quorum',
      },
    });

    // Allow node group to access Redis
    redisSecurityGroup.connections.allowFrom(
      ec2.Peer.securityGroupId(cluster.clusterSecurityGroupId),
      ec2.Port.tcp(6379),
      'Allow Redis traffic from EKS pods'
    );

    // =========================================================================
    // 8. IRSA — IAM Roles for Service Accounts
    // =========================================================================

    // API service account — needs RDS IAM auth
    const apiServiceAccount = cluster.addServiceAccount('QuorumApiServiceAccount', {
      name: 'quorum-api',
      namespace: 'quorum',
    });

    apiServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['rds-db:connect'],
      resources: [`arn:aws:rds-db:${this.region}:${this.account}:dbuser:${dbResourceId}/postgres`],
    }));

    // Grant ECR pull access to node group
    apiRepo.grantPull(nodeGroup.role);
    webRepo.grantPull(nodeGroup.role);
    agentRepo.grantPull(nodeGroup.role);

    // =========================================================================
    // 9. AWS Load Balancer Controller — manages ALB Ingress
    // =========================================================================
    const albServiceAccount = cluster.addServiceAccount('AwsLoadBalancerController', {
      name: 'aws-load-balancer-controller',
      namespace: 'kube-system',
    });

    // The ALB controller needs broad permissions for managing ALBs/NLBs
    albServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'ec2:DescribeAccountAttributes',
        'ec2:DescribeAddresses',
        'ec2:DescribeAvailabilityZones',
        'ec2:DescribeInternetGateways',
        'ec2:DescribeVpcs',
        'ec2:DescribeVpcPeeringConnections',
        'ec2:DescribeSubnets',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeInstances',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DescribeTags',
        'ec2:GetCoipPoolUsage',
        'ec2:DescribeCoipPools',
        'ec2:CreateSecurityGroup',
        'ec2:AuthorizeSecurityGroupIngress',
        'ec2:RevokeSecurityGroupIngress',
        'ec2:DeleteSecurityGroup',
        'ec2:CreateTags',
        'ec2:DeleteTags',
        'elasticloadbalancing:*',
        'iam:CreateServiceLinkedRole',
        'iam:GetServerCertificate',
        'iam:ListServerCertificates',
        'cognito-idp:DescribeUserPoolClient',
        'acm:ListCertificates',
        'acm:DescribeCertificate',
        'waf-regional:*',
        'wafv2:*',
        'tag:GetResources',
        'tag:TagResources',
        'shield:GetSubscriptionState',
        'shield:DescribeProtection',
        'shield:CreateProtection',
        'shield:DeleteProtection',
      ],
      resources: ['*'],
    }));

    // Install ALB Controller via Helm chart
    cluster.addHelmChart('AwsLoadBalancerControllerChart', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: 'kube-system',
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: {
          create: false,
          name: 'aws-load-balancer-controller',
        },
        region: this.region,
        vpcId: vpc.vpcId,
      },
    });

    // =========================================================================
    // 10. Kubernetes Namespace and ConfigMap (provisioned via CDK)
    // =========================================================================
    const quorumNamespace = cluster.addManifest('QuorumNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'quorum',
        labels: {
          'app.kubernetes.io/part-of': 'quorum',
        },
      },
    });
    
    // Ensure namespace is created before the service account and config map
    apiServiceAccount.node.addDependency(quorumNamespace);

    // Create the quorum ConfigMap with infrastructure-derived values
    const quorumConfigMap = cluster.addManifest('QuorumConfigMap', {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'quorum-infra-config',
        namespace: 'quorum',
      },
      data: {
        REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
        DATABASE_HOST: dbHost,
        LIVEKIT_URL: livekitUrl,
        AWS_REGION: this.region,
      },
    });
    quorumConfigMap.node.addDependency(quorumNamespace);

    // =========================================================================
    // 11. Datadog Namespace and Secret (placeholder)
    // =========================================================================
    const datadogNamespace = cluster.addManifest('DatadogNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'datadog',
      },
    });
    
    // Chain remaining Custom Resources to avoid rate limiting
    albServiceAccount.node.addDependency(datadogNamespace);


    // =========================================================================
    // Outputs
    // =========================================================================
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'The name of the EKS cluster',
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint,
      description: 'The API endpoint of the EKS cluster',
    });

    new cdk.CfnOutput(this, 'ClusterOidcIssuer', {
      value: cluster.clusterOpenIdConnectIssuerUrl,
      description: 'The OIDC issuer URL for IRSA',
    });

    new cdk.CfnOutput(this, 'ApiRepoUri', {
      value: apiRepo.repositoryUri,
      description: 'ECR URI for quorum-api images',
    });

    new cdk.CfnOutput(this, 'WebRepoUri', {
      value: webRepo.repositoryUri,
      description: 'ECR URI for quorum-web images',
    });

    new cdk.CfnOutput(this, 'AgentRepoUri', {
      value: agentRepo.repositoryUri,
      description: 'ECR URI for quorum-agent images',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificateArn,
      description: 'ACM certificate ARN for ALB Ingress (provide via --context certificateArn=arn:...)',
    });

    new cdk.CfnOutput(this, 'ApiServiceAccountRoleArn', {
      value: apiServiceAccount.role.roleArn,
      description: 'IAM role ARN for quorum-api K8s service account (IRSA)',
    });

    new cdk.CfnOutput(this, 'KubeconfigCommand', {
      value: `aws eks update-kubeconfig --name ${cluster.clusterName} --region ${this.region}`,
      description: 'Run this command to update your local kubeconfig',
    });
  }
}
