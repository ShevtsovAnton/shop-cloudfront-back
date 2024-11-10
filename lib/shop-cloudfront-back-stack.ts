import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class ShopCloudfrontBackStack extends cdk.Stack {
  catalogItemsQueue: sqs.Queue; 

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue');
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic')

    const productsTable = dynamodb.Table.fromTableName(this, 'Products', 'Products');

    const stockTable = dynamodb.Table.fromTableName(this, 'Stock', 'Stock');

    const getProductsListLambda = new lambda.Function(this, 'get-products-list-lambda-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'index.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    productsTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductsListLambda);

    const getProductsByIdLambda = new lambda.Function(this, 'get-products-by-id-lambda-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'index.getProductsById',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    productsTable.grantReadData(getProductsByIdLambda);
    stockTable.grantReadData(getProductsByIdLambda);

    const createProductLambda = new lambda.Function(this, 'create-product-lambda-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'index.createProduct',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const catalogBatchProcessLambda = new lambda.Function(this, 'catalog-batch-process-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'index.catalogBatchProcess',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
        CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    catalogBatchProcessLambda.addEventSource(new SqsEventSource(this.catalogItemsQueue, {batchSize: 5}));

    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);
    productsTable.grantWriteData(catalogBatchProcessLambda);
    stockTable.grantWriteData(catalogBatchProcessLambda);

    createProductTopic.addSubscription(new subscriptions.EmailSubscription('anton_shevtsov1@epam.com'));
    createProductTopic.addSubscription(new subscriptions.EmailSubscription('teab09@gmail.com', {
      filterPolicy: {
        price: sns.SubscriptionFilter.numericFilter({
          greaterThan: 100,
        }),
      }
    }));
    createProductTopic.grantPublish(catalogBatchProcessLambda);

    const api = new apigateway.RestApi(this, "products-api", {
      restApiName: "My Products API Gateway",
      description: "This API serves the Lambda functions."
    });

    const productsListLambdaIntegration = new apigateway.LambdaIntegration(getProductsListLambda, {
      integrationResponses: [
        {statusCode: '200'},
      ],
      proxy: false,
    });

    const productByIdLambdaIntegration = new apigateway.LambdaIntegration(getProductsByIdLambda, {
      requestTemplates: {
        'application/json': `
        {
          "id": "$input.params('id')"
        }
      `,
      },
      integrationResponses: [
        {statusCode: '200'},
      ],
      proxy: false,
    });

    const createProductLambdaIntegration = new apigateway.LambdaIntegration(createProductLambda, {
      integrationResponses: [
        {statusCode: '200'},
      ],
      requestTemplates: {
        "application/json": "$input.json('$')" 
      },
      proxy: false
    });

    const productsResource = api.root.addResource("products");
    const productByIdResource = productsResource.addResource('{id}');

    productsResource.addMethod('GET', productsListLambdaIntegration, {
      methodResponses: [{statusCode: '200'}]
    });

    productsResource.addMethod('POST', createProductLambdaIntegration, {
      methodResponses: [{statusCode: '200'}]
    });


    productByIdResource.addMethod('GET', productByIdLambdaIntegration, {
      methodResponses: [{statusCode: '200'}]
    });

    productsResource.addCorsPreflight({
      allowOrigins: ['https://dtv7uztm15bn1.cloudfront.net'],
      allowMethods: ['GET', 'POST', 'OPTIONS']
    });

    productByIdResource.addCorsPreflight({
      allowOrigins: ['https://dtv7uztm15bn1.cloudfront.net'],
      allowMethods: ['GET', 'OPTIONS']
    });
  }
}