export interface ShopifyConfig {
  vendorName: string;
  rootDomain: string;
}

export interface ShopifyResponse {
  products: ShopifyProduct[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
}

export interface ShopifyImage {
  id: number;
  created_at: string;
  position: number;
  updated_at: string;
  product_id: number;
  variant_ids: number[];
  src: string;
  width: number;
  height: number;
}

export interface ShopifyOption {
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyVariant {
  id: number;
  title: string;
  option1: string;
  option2: null;
  option3: null;
  sku: null | string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image: null;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: null;
  position: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

