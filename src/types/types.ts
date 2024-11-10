export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
  }
  
  export type StockProduct = Product & { count: number };
  
  export type PayloadProduct = Omit<StockProduct, 'id'>;
  
  export interface Stock {
    product_id: string;
    count: number;
  }

