import {Handler} from 'aws-lambda';
import {DynamoDBClient, ScanCommand} from "@aws-sdk/client-dynamodb";
import {unmarshall} from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({region: "us-east-1"});

export const getProductsList: Handler = async () => {
  try {
    const scanProductsCommand = new ScanCommand({TableName: 'Products'});
    const productsResponse = await client.send(scanProductsCommand);

    let products: any[] = [];
    if (productsResponse.Items) {
      products = productsResponse.Items.map(item =>
        unmarshall(item)
      );
    }

    const scanStockCommand = new ScanCommand({TableName: 'Stock'});
    const stockResponse = await client.send(scanStockCommand);
    let stock: any[] = [];

    if (stockResponse.Items) {
      stock = stockResponse.Items.map(item =>
        unmarshall(item)
      );
    }

    return products?.map(product => {
      const stockItem = stock?.find(stock => stock.product_id === product.id);
      const count = stockItem?.count || 0;

      return {
        ...product, count
      };
    });

  } catch (error) {
    return {
      statusCode: 500,
      body: `An error occurred while retrieving the products ${error}`,
    };
  }
}

