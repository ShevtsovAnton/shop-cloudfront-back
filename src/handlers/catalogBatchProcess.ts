import { SQSEvent } from "aws-lambda";
import { SNS, PublishCommand} from "@aws-sdk/client-sns";
import { createProduct } from "./createProduct";
import { PayloadProduct } from "../types/types";


const sns = new SNS({ region: process.env.AWS_REGION });

export const catalogBatchProcess = async (event: SQSEvent) => {
  for (const record of event.Records) {
    let product: PayloadProduct;
    try {
      product = JSON.parse(record.body);
      await createProduct(product);
    } catch (error) {
      console.log('unable to create a product', record, error);
      continue;
    }
    await sns.send(new PublishCommand({
      TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
      Subject: 'Product created',
      Message: `
        title: ${product.title}
        description: ${product.description}
        count: ${product.count}
        price: ${product.price}
      `,
      MessageAttributes: {
        price: {
          DataType: 'Number',
          StringValue: product.price.toString(),
        }
      }
    }))
  }
}
