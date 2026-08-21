#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
new InfrastructureStack(app, 'QuorumInfrastructureStack', {
  env: { 
    account: '238158254662', 
    region: 'eu-north-1' // Same region as RDS database 
  },
});
