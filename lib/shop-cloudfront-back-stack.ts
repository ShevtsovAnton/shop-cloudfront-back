import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';

export class ShopCloudfrontBackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);

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