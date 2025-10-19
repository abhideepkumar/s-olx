"use client";

import { SemanticSearchBar, SearchResults } from "@/components/semantic-search-bar";
import { TrendingProducts } from "@/components/product-recommendations";
import { useState } from "react";

interface SearchResult {
  _id: string
  title: string
  description: string
  price: number
  images: string[]
  condition: string
  category: string
  tags: string[]
  seller: {
    name: string
    clg_name: string
    profile_url: string
  }
  similarity?: number
  searchScore?: number
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Find What You Need</h1>
      </div>
      
      {/* AI-Powered Semantic Search */}
      <div className="max-w-2xl mx-auto">
        <SemanticSearchBar 
          onSearch={(results) => {
            setSearchResults(results);
            setIsSearching(true);
          }}
          placeholder="Search products with AI... (e.g., 'iPhone 13 blue', 'Apple smartphone')"
        />
      </div>

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <SearchResults 
          results={searchResults}
        />
      )}

      {/* Trending Products */}
      {!isSearching && (
        <TrendingProducts className="mb-8" />
      )}
    </div>
  );
}
