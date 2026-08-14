import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create a new VPC with Public and Private subnets
    const vpc = new ec2.Vpc(this, 'QuorumVpc', {
      maxAzs: 2,
      natGateways: 1, // Minimize cost for development
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

    // 2. Provision Amazon ElastiCache (Redis) in private subnets
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

    // 3. Create ECS Cluster for Fargate tasks
    const cluster = new ecs.Cluster(this, 'QuorumCluster', {
      vpc,
      clusterName: 'QuorumCluster',
    });

    // We will use a secret for sensitive environment variables
    const secret = new secretsmanager.Secret(this, 'QuorumSecrets', {
      secretName: 'quorum-production-secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          JWT_SECRET: 'dev-secret-change-this-in-production',
          LIVEKIT_API_KEY: 'set-me',
          LIVEKIT_API_SECRET: 'set-me',
          S3_ACCESS_KEY_ID: 'set-me',
          S3_SECRET_ACCESS_KEY: 'set-me',
        }),
        generateStringKey: 'dummy',
      },
    });

    // 4. API Service (Load Balanced Fargate Service)
    const apiService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'QuorumApiService', {
      cluster,
      memoryLimitMiB: 1024,
      cpu: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../', {
          file: 'apps/api/Dockerfile',
          exclude: ['node_modules', 'dist', '.next', '.venv', 'infrastructure/cdk.out', '.git'],
        }),
        containerPort: 3001,
        environment: {
          DATABASE_IAM_AUTH: 'true',
          DATABASE_HOST: 'database-1.cluster-cvs68yyk49gx.eu-north-1.rds.amazonaws.com',
          DATABASE_PORT: '5432',
          DATABASE_USER: 'postgres',
          DATABASE_NAME: 'postgres',
          AWS_REGION: 'eu-north-1',
          REDIS_HOST: redisCluster.attrRedisEndpointAddress,
          REDIS_PORT: redisCluster.attrRedisEndpointPort,
          LIVEKIT_URL: 'wss://quorum-oor689rg.livekit.cloud',
        },
        secrets: {
          JWT_SECRET: ecs.Secret.fromSecretsManager(secret, 'JWT_SECRET'),
          LIVEKIT_API_KEY: ecs.Secret.fromSecretsManager(secret, 'LIVEKIT_API_KEY'),
          LIVEKIT_API_SECRET: ecs.Secret.fromSecretsManager(secret, 'LIVEKIT_API_SECRET'),
          S3_ACCESS_KEY_ID: ecs.Secret.fromSecretsManager(secret, 'S3_ACCESS_KEY_ID'),
          S3_SECRET_ACCESS_KEY: ecs.Secret.fromSecretsManager(secret, 'S3_SECRET_ACCESS_KEY'),
        },
      },
      publicLoadBalancer: true, // Exposed to the internet
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Task runs in private subnet
      },
    });

    // Grant API task permission to connect to RDS using IAM
    apiService.taskDefinition.taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['rds-db:connect'],
      resources: ['*'], // In production, restrict to the specific RDS cluster ARN
    }));

    redisSecurityGroup.connections.allowFrom(apiService.service, ec2.Port.tcp(6379), 'Allow Redis traffic from API');

    // 5. Agent Service (Background Fargate Service)
    // The agent doesn't need to be exposed to the internet, so it's not load balanced
    const agentTaskDef = new ecs.FargateTaskDefinition(this, 'QuorumAgentTask', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    agentTaskDef.addContainer('AgentContainer', {
      image: ecs.ContainerImage.fromAsset('../', {
        file: 'apps/agent/Dockerfile',
        exclude: ['node_modules', 'dist', '.next', '.venv', 'infrastructure/cdk.out', '.git'],
      }),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'Agent' }),
      environment: {
        LIVEKIT_URL: 'wss://quorum-oor689rg.livekit.cloud',
        REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
      },
      secrets: {
        LIVEKIT_API_KEY: ecs.Secret.fromSecretsManager(secret, 'LIVEKIT_API_KEY'),
        LIVEKIT_API_SECRET: ecs.Secret.fromSecretsManager(secret, 'LIVEKIT_API_SECRET'),
      },
    });

    const agentService = new ecs.FargateService(this, 'QuorumAgentService', {
      cluster,
      taskDefinition: agentTaskDef,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    redisSecurityGroup.connections.allowFrom(agentService, ec2.Port.tcp(6379), 'Allow Redis traffic from Agent');

    // 6. Next.js Frontend (AWS Amplify)
    // Note: The user will need to connect their GitHub repository manually in the AWS Console 
    // or provide a personal access token. We define the basic structure here.
    const amplifyApp = new amplify.App(this, 'QuorumWebApp', {
      appName: 'QuorumWeb',
      // To automate this completely, we'd use sourceCodeProvider with a GitHub token
      // sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
      //   owner: 'Abhitvg',
      //   repository: 'Quorum',
      //   oauthToken: cdk.SecretValue.secretsManager('github-token'),
      // }),
      environmentVariables: {
        NEXT_PUBLIC_API_URL: apiService.loadBalancer.loadBalancerDnsName,
        NEXT_PUBLIC_LIVEKIT_URL: 'wss://quorum-oor689rg.livekit.cloud',
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiService.loadBalancer.loadBalancerDnsName,
      description: 'The URL of the API Gateway / Load Balancer',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.appId,
      description: 'The AWS Amplify App ID. Connect your GitHub repository in the AWS Console.',
    });
  }
}
