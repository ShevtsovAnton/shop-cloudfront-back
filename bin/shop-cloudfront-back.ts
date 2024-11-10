#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShopCloudfrontBackStack } from '../lib/shop-cloudfront-back-stack';
import { ImportServiceStack } from '../lib/import-service/import-service-stack';

const app = new cdk.App();

const shopCloudfrontBackStack  = new ShopCloudfrontBackStack(app, 'ShopCloudfrontBackStack', {});
new ImportServiceStack(app, 'ImportServiceStack', shopCloudfrontBackStack, {});