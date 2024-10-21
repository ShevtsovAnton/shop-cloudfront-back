import { products } from "../mocks/data";


export type Product = {
    id: string;
    title: string;
    description: string;
    price: number;
    count: number;
  }

export const getAllProducts = async (): Promise<Product[]> => {
  return products;
}

export const getProductById = async (id: string): Promise<Product | undefined> => {
  return products.find((product) => product.id === id);
}