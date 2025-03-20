// @/hooks/useSearch.tsx
import { useState, useEffect, useMemo } from 'react';
import { Farmer, FilterParams, SortConfig, PaginationConfig } from '../types';
import { farmers as mockFarmers } from '../utils/mockData'; // Keeping as fallback

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<FilterParams>({});
  const [results, setResults] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: undefined });
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
  });

  // Debounce the query
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [query]);

  // Process the query when it changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilters({});
      setResults([]);
      setPagination(prev => ({ ...prev, totalItems: 0 }));
      return;
    }

    setLoading(true);
    setError(null);
    
    // Fetch data from backend
    const fetchData = async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
        
        if (!BACKEND_URL) {
          throw new Error('Backend URL is not configured');
        }

        const response = await fetch(`${BACKEND_URL}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: debouncedQuery }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Extract filters from tool_calls arguments if available
        let extractedFilters: FilterParams = {};
        if (data.response?.tool_calls?.length > 0) {
          const toolCallArgs = data.response.tool_calls[0].arguments;
          
          // Convert API response to our filter structure
          extractedFilters = convertApiArgsToFilters(toolCallArgs);
        }
        
        // Process tool_messages to get farmer data
        let farmersData: Farmer[] = [];
        if (data.response?.tool_messages?.length > 0) {
          farmersData = parseFarmersFromToolMessages(data.response.tool_messages);
        }
        
        setFilters(extractedFilters);
        setResults(farmersData);
        setPagination(prev => ({ 
          ...prev, 
          currentPage: 1, 
          totalItems: farmersData.length 
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setResults([]);
        setPagination(prev => ({ ...prev, totalItems: 0 }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery]);

  // Parse farmers data from tool_messages
  const parseFarmersFromToolMessages = (toolMessages: string[]): Farmer[] => {
    if (!toolMessages.length) return [];

    try {
      // The tool message contains data in a string format that looks like a JSON
      // We need to parse this manually since it's not valid JSON
      const farmersData: Farmer[] = [];
      
      toolMessages.forEach(message => {
        // Extract the data between RealDictRow({ and })
        const match = message.match(/RealDictRow\(\{(.*?)\}\)/s);
        if (!match) return;
        
        const dataStr = match[1];
        // Convert to key-value pairs we can work with
        const keyValuePairs = dataStr.split(', ');
        const farmerData: Record<string, any> = {};
        
        keyValuePairs.forEach(pair => {
          const [key, value] = pair.split(': ');
          if (key && value) {
            // Clean up the key and value
            const cleanKey = key.replace(/'/g, '').trim();
            let cleanValue = value.replace(/^'|'$/g, '').trim();
            
            // Handle null values
            if (cleanValue === 'None') {
              farmerData[cleanKey] = null;
            } else if (cleanValue.startsWith('datetime.date')) {
              // Handle date objects
              const dateMatch = cleanValue.match(/\((\d+), (\d+), (\d+)\)/);
              if (dateMatch) {
                farmerData[cleanKey] = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
              } else {
                farmerData[cleanKey] = cleanValue;
              }
            } else if (cleanValue.startsWith('Decimal')) {
              // Handle Decimal objects
              const decimalMatch = cleanValue.match(/\('(.*?)'\)/);
              if (decimalMatch) {
                farmerData[cleanKey] = parseFloat(decimalMatch[1]);
              } else {
                farmerData[cleanKey] = cleanValue;
              }
            } else if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
              // Convert numeric strings to numbers
              farmerData[cleanKey] = Number(cleanValue);
            } else {
              farmerData[cleanKey] = cleanValue;
            }
          }
        });
        
        // Map the parsed data to our Farmer type
        const farmer: Farmer = {
          id: farmerData.dataid?.toString() || '',
          name: `${farmerData.firstname || ''} ${farmerData.lastname || ''}`.trim(),
          contact: farmerData.mobilenumber1 || '',
          gender: farmerData.gender as 'Male' | 'Female' | 'Other',
          age: farmerData.age || 0,
          district: farmerData.district || '',
          state: farmerData.state || '',
          religion: farmerData.religion || '',
          casteCategory: farmerData.castecategory || '',
          maritalStatus: farmerData.martialstatus || '',
          landOwned: farmerData.landowned || 0,
          cropTypes: farmerData.croptypes ? farmerData.croptypes.split(', ') : [],
          crops: farmerData.cropassociated ? farmerData.cropassociated.split(', ') : [],
          irrigationFacility: farmerData.irrigationfacility === 'Yes',
          associatedWithFPO: farmerData.associatedwithfpo === 'Yes',
          fpoName: farmerData.fponame || undefined,
          source: [farmerData.source1, farmerData.source2, farmerData.source3]
            .filter(Boolean)
            .join(', '),
        };
        
        farmersData.push(farmer);
      });
      
      return farmersData;
    } catch (error) {
      console.error('Error parsing farmers data:', error);
      return [];
    }
  };

  // Convert API tool call arguments to our filter structure
  const convertApiArgsToFilters = (args: Record<string, any>): FilterParams => {
    const filters: FilterParams = {};

    // Initialize filter categories
    if (!filters.demographics) filters.demographics = {};
    if (!filters.crop_data) filters.crop_data = {};
    if (!filters.organization) filters.organization = {};
    if (!filters.source) filters.source = {};
    
    // Map API response fields to our filter structure
    if (args.district) {
      filters.demographics!.district = Array.isArray(args.district) 
        ? args.district 
        : [args.district];
    }
    
    if (args.state) {
      filters.demographics!.state = Array.isArray(args.state) 
        ? args.state 
        : [args.state];
    }
    
    if (args.gender) {
      filters.demographics!.gender = args.gender;
    }
    
    if (args.religion) {
      filters.demographics!.religion = args.religion;
    }
    
    if (args.caste_category) {
      filters.demographics!.casteCategory = args.caste_category;
    }
    
    if (args.marital_status) {
      filters.demographics!.maritalStatus = args.marital_status;
    }
    
    if (args.crop_types) {
      filters.crop_data!.cropTypes = Array.isArray(args.crop_types) 
        ? args.crop_types 
        : [args.crop_types];
    }
    
    if (args.crops) {
      filters.crop_data!.crops = Array.isArray(args.crops) 
        ? args.crops 
        : [args.crops];
    }
    
    if (args.irrigation_facility !== undefined) {
      filters.crop_data!.irrigationFacility = args.irrigation_facility === 'Yes' || 
        args.irrigation_facility === true;
    }
    
    if (args.land_owned_min || args.land_owned_max) {
      filters.crop_data!.landOwned = {};
      
      if (args.land_owned_min) {
        filters.crop_data!.landOwned.min = parseFloat(args.land_owned_min);
      }
      
      if (args.land_owned_max) {
        filters.crop_data!.landOwned.max = parseFloat(args.land_owned_max);
      }
    }
    
    if (args.associated_with_fpo !== undefined) {
      filters.organization!.associatedWithFPO = args.associated_with_fpo === 'Yes' || 
        args.associated_with_fpo === true;
    }
    
    if (args.fpo_name) {
      filters.organization!.fpoName = args.fpo_name;
    }
    
    if (args.source) {
      filters.source!.name = args.source;
    }
    
    return filters;
  };

  // Handle sorting
  const sortedResults = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return results;
    
    return [...results].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [results, sortConfig]);

  // Handle pagination
  const paginatedResults = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return sortedResults.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [sortedResults, pagination.currentPage, pagination.itemsPerPage]);

  // Manual filter updates - this will need to trigger a new API call
  const updateFilters = (newFilters: FilterParams) => {
    setFilters(newFilters);
    
    // For now, we'll just build a query string based on the filters
    // In a real implementation, you might want to create a more sophisticated NL query
    // Or implement a separate API endpoint that accepts filter parameters directly
    const queryParts: string[] = ["Show me farmers"];
    
    if (newFilters.demographics?.district?.length) {
      queryParts.push(`in ${newFilters.demographics.district.join(' or ')} district`);
    }
    
    if (newFilters.demographics?.gender) {
      queryParts.push(`who are ${newFilters.demographics.gender.toLowerCase()}`);
    }
    
    if (newFilters.crop_data?.crops?.length) {
      queryParts.push(`who grow ${newFilters.crop_data.crops.join(' or ')}`);
    }
    
    if (newFilters.crop_data?.irrigationFacility) {
      queryParts.push("with irrigation facilities");
    }
    
    if (newFilters.organization?.associatedWithFPO) {
      queryParts.push("associated with FPO");
      
      if (newFilters.organization.fpoName) {
        queryParts.push(`specifically ${newFilters.organization.fpoName}`);
      }
    }
    
    // Set the constructed query
    setQuery(queryParts.join(' '));
  };

  const requestSort = (key: keyof Farmer) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = undefined;
    }
    
    setSortConfig({ key, direction });
  };

  const changePage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const changeItemsPerPage = (itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    results: paginatedResults,
    loading,
    error,
    sortConfig,
    requestSort,
    pagination,
    changePage,
    changeItemsPerPage,
    totalResults: results.length
  };
};

export type SortDirection = 'asc' | 'desc' | undefined;