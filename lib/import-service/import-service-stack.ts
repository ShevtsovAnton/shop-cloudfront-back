import * as cdk from 'aws-cdk-lib';
import { aws_s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeJsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as notifications from "aws-cdk-lib/aws-s3-notifications";
import * as path from "path";
import { HttpMethods } from "aws-cdk-lib/aws-s3";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new aws_s3.Bucket(this, 'ImportServiceBucket', {
      cors: [{
        allowedHeaders: ["*"],
        allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE],
        allowedOrigins: ["*"],
        exposedHeaders: ["ETag"],
        maxAge: 3000
      }],
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const importProductsFileLambda = new nodeJsLambda.NodejsFunction(this, 'ImportProductsFileLambda', {
      entry: path.join(__dirname, './handlers/import-products-file.ts'),
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'importProductsFile',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      }
    });

    const importFileParserLambda = new nodeJsLambda.NodejsFunction(this, 'ImportFileParserLambda', {
      entry: path.join(__dirname, './handlers/import-file-parser.ts'),
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'importFileParser',
      environment: {
        BUCKET_NAME: bucket.bucketName,
      }
    });

    bucket.grantWrite(importProductsFileLambda);
    bucket.grantReadWrite(importFileParserLambda);
    bucket.grantDelete(importFileParserLambda);

    bucket.addObjectCreatedNotification(new notifications.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });

    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service",
      description: "Import Service.",
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: ['GET', 'OPTIONS', 'PUT'],
      },
    });

    const importResource = api.root.addResource('import');

    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda, {
      requestTemplates: {
        'application/json': `{ "filename": "$input.params('filename')" }`
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'GET, OPTIONS, PUT'",
            'method.response.header.Access-Control-Allow-Headers': "'*'",
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'GET, OPTIONS, PUT'",
            'method.response.header.Access-Control-Allow-Headers': "'*'",
          },
          responseTemplates: {
            'application/json': '{"message": "Internal server error"}',
          },
          selectionPattern: '(\n|.)+',
        }
      ],
      proxy: false,
    }), {
      requestParameters: {
        'method.request.querystring.filename': true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      methodResponses: [
          {
              statusCode: '200',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true,
                'method.response.header.Access-Control-Allow-Methods': true,
                'method.response.header.Access-Control-Allow-Headers': true,
              },
          },
          {
              statusCode: '500',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true,
                'method.response.header.Access-Control-Allow-Methods': true,
                'method.response.header.Access-Control-Allow-Headers': true,
              },
          },
      ],
    });
  }
}
