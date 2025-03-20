// pages/index.tsx
import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ResultsTable from '../components/ResultsTable';
import { useSearch } from '../hooks/useSearch';

const Index = () => {
  const {
    query,
    setQuery,
    filters,
    updateFilters,
    results,
    loading,
    error,
    sortConfig,
    requestSort,
    pagination,
    changePage,
    changeItemsPerPage,
    totalResults
  } = useSearch();

  const [showIntro, setShowIntro] = useState(true);

  // Hide intro after delay or on search
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (query) {
      setShowIntro(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <div className={`transition-all duration-700 ease-in-out ${
          showIntro ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-16 pointer-events-none absolute'
        }`}>
          <h1 className="text-4xl font-light tracking-tight text-gray-900 text-center mb-3">
            Farm Data Query System
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-8">
            Search for farmers using natural language queries like "Show me all farmers in Nagpur who grow vegetables and have irrigation facilities"
          </p>
        </div>
        
        <div className={`transition-all duration-500 ${
          showIntro ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">
            Farm Data Query
          </h1>
          <p className="text-gray-600 mb-6">
            Search for farmers using natural language
          </p>
        </div>
      </div>
      
      <SearchBar 
        query={query} 
        setQuery={setQuery} 
        loading={loading} 
      />
      
      {error && (
        <div className="w-full max-w-4xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm flex items-start">
            <span className="flex-shrink-0 mr-2">⚠️</span>
            <div>
              <h3 className="font-medium">Error connecting to the database</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <FilterPanel 
        filters={filters} 
        updateFilters={updateFilters} 
        totalResults={totalResults}
      />
      
      <ResultsTable 
        results={results}
        loading={loading}
        sortConfig={sortConfig}
        requestSort={requestSort}
        pagination={pagination}
        changePage={changePage}
        changeItemsPerPage={changeItemsPerPage}
        totalResults={totalResults}
      />
    </div>
  );
};

export default Index;