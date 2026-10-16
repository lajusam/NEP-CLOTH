import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../lib/api";

export default function useProducts(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: ({ signal }) => fetchProducts({ ...filters, signal }),
    ...options,
  });
}
