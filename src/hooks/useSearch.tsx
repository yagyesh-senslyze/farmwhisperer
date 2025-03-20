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
        console.log('API Response:', data); // For debugging
        
        // Extract filters from tool_calls arguments if available
        let extractedFilters: FilterParams = {};
        if (data.response?.tool_calls?.length > 0) {
          // Get the arguments from the first tool call
          const toolCallArgs = data.response.tool_calls[0].arguments;
          console.log('Tool Call Arguments:', toolCallArgs); // For debugging
          
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
      // Check if the tool message is an empty array
      if (toolMessages[0].trim() === "[]") {
        return [];
      }

      // The tool message contains data in a string format that looks like a JSON
      // We need to parse this manually since it's not valid JSON
      const farmersData: Farmer[] = [];
      
      toolMessages.forEach(message => {
        // Extract each RealDictRow
        const regex = /RealDictRow\(\{(.*?)\}\)/gs;
        let match;
        
        while ((match = regex.exec(message)) !== null) {
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
            country: farmerData.country || '',
            state: farmerData.state || '',
            district: farmerData.district || '',
            blockTaluka: farmerData.blocktaluka || '',
            village: farmerData.villagename || '',
            pincode: farmerData.pincode || '',
            religion: farmerData.religion || '',
            casteCategory: farmerData.castecategory || '',
            maritalStatus: farmerData.martialstatus || '',
            bankAccountHolder: farmerData.bankaccountholder === 'Yes',
            bankName: farmerData.bankname || '',
            occupation: farmerData.occupation || '',
            incomeRange: farmerData.incomerange || '',
            landOwned: farmerData.landowned || 0,
            cropTypes: farmerData.croptypes ? farmerData.croptypes.split(', ') : [],
            crops: farmerData.cropassociated ? farmerData.cropassociated.split(', ') : [],
            irrigationFacility: farmerData.irrigationfacility === 'Yes',
            cropCultivationYear: farmerData.cropcultivationyear || null,
            farmMachineryOwned: farmerData.farmmachineryowned || '',
            associatedWithFPO: farmerData.associatedwithfpo === 'Yes',
            fpoName: farmerData.fponame || undefined,
            source: [farmerData.source1, farmerData.source2, farmerData.source3]
              .filter(Boolean)
              .join(', '),
          };
          
          farmersData.push(farmer);
        }
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

    console.log('Processing arguments for filters:', args);

    // Map all arguments to our filter structure
    Object.entries(args).forEach(([key, value]) => {
      console.log(`Processing argument: ${key} = ${value}`);
      
      // Convert value to proper type 
      // For yes/no values that come as strings
      if (value === "Yes" || value === "No") {
        value = value === "Yes";
      }
      
      // Handle each argument based on its key
      switch (key.toLowerCase()) {
        // Demographics filters
        case 'gender':
          filters.demographics!.gender = value;
          break;
        case 'country':
          filters.demographics!.country = value;
          break;
        case 'state':
        case 'states':
          filters.demographics!.state = Array.isArray(value) ? value : [value];
          break;
        case 'district':
        case 'districts':
          filters.demographics!.district = Array.isArray(value) ? value : [value];
          break;
        case 'blocktaluka':
        case 'block':
        case 'taluka':
          filters.demographics!.blockTaluka = Array.isArray(value) ? value : [value];
          break;
        case 'villagename':
        case 'village':
          filters.demographics!.village = Array.isArray(value) ? value : [value];
          break;
        case 'pincode':
          filters.demographics!.pincode = value;
          break;
        case 'religion':
          filters.demographics!.religion = value;
          break;
        case 'caste_category':
        case 'castecategory':
        case 'caste':
          filters.demographics!.casteCategory = value;
          break;
        case 'marital_status':
        case 'maritalstatus':
        case 'martialstatus': // Handle potential typo in the API
          filters.demographics!.maritalStatus = value;
          break;
        case 'min_age':
          if (!filters.demographics!.age) filters.demographics!.age = {};
          filters.demographics!.age.min = parseInt(value);
          break;
        case 'max_age':
          if (!filters.demographics!.age) filters.demographics!.age = {};
          filters.demographics!.age.max = parseInt(value);
          break;
        case 'age':
          if (!filters.demographics!.age) filters.demographics!.age = {};
          if (typeof value === 'object' && value !== null) {
            if ('min' in value) filters.demographics!.age.min = parseInt(value.min);
            if ('max' in value) filters.demographics!.age.max = parseInt(value.max);
          } else {
            // If it's an exact age
            filters.demographics!.age.min = parseInt(value);
            filters.demographics!.age.max = parseInt(value);
          }
          break;
        case 'bankaccountholder':
        case 'bank_account_holder': 
          filters.demographics!.bankAccountHolder = value === true || value === "Yes";
          break;
        case 'bankname':
        case 'bank_name':
          filters.demographics!.bankName = value;
          break;
        case 'occupation':
          filters.demographics!.occupation = value;
          break;
        case 'incomerange':
        case 'income_range':
          filters.demographics!.incomeRange = value;
          break;

        // Crop data filters
        case 'crop_type':
        case 'croptypes':
          filters.crop_data!.cropTypes = Array.isArray(value) ? value : [value];
          break;
        case 'crop':
        case 'crops':
        case 'cropassociated':
          filters.crop_data!.crops = Array.isArray(value) ? value : [value];
          break;
        case 'irrigation':
        case 'irrigation_facility':
        case 'irrigationfacility':
        case 'has_irrigation':
          filters.crop_data!.irrigationFacility = value === true || value === "Yes";
          break;
        case 'min_land':
        case 'landowned_min':
          if (!filters.crop_data!.landOwned) filters.crop_data!.landOwned = {};
          filters.crop_data!.landOwned.min = parseFloat(value);
          break;
        case 'max_land':
        case 'landowned_max':
          if (!filters.crop_data!.landOwned) filters.crop_data!.landOwned = {};
          filters.crop_data!.landOwned.max = parseFloat(value);
          break;
        case 'land_owned':
        case 'landowned':
        case 'land':
          // If an exact land size is specified
          if (!filters.crop_data!.landOwned) filters.crop_data!.landOwned = {};
          if (typeof value === 'object' && value !== null) {
            if ('min' in value) filters.crop_data!.landOwned.min = parseFloat(value.min);
            if ('max' in value) filters.crop_data!.landOwned.max = parseFloat(value.max);
          } else {
            // If it's an exact land size
            const landValue = parseFloat(value);
            if (!isNaN(landValue)) {
              filters.crop_data!.landOwned.min = landValue;
              filters.crop_data!.landOwned.max = landValue;
            }
          }
          break;
        case 'cropcultivationyear':
        case 'crop_cultivation_year':
          filters.crop_data!.cropCultivationYear = parseInt(value);
          break;
        case 'farmmachineryowned':
        case 'farm_machinery_owned':
          filters.crop_data!.farmMachineryOwned = value;
          break;

        // Organization filters
        case 'associated_with_fpo':
        case 'associatedwithfpo':
        case 'fpo':
        case 'in_fpo':
          filters.organization!.associatedWithFPO = value === true || value === "Yes";
          break;
        case 'fpo_name':
        case 'fponame':
          filters.organization!.fpoName = value;
          break;

        // Source filters
        case 'source':
        case 'data_source':
          filters.source!.name = value;
          break;

        default:
          // For any other unknown filter keys, log them for debugging
          console.log(`Unknown filter key: ${key} with value: ${value}`);
      }
    });

    // Clean up empty filter categories
    if (Object.keys(filters.demographics!).length === 0) delete filters.demographics;
    if (Object.keys(filters.crop_data!).length === 0) delete filters.crop_data;
    if (Object.keys(filters.organization!).length === 0) delete filters.organization;
    if (Object.keys(filters.source!).length === 0) delete filters.source;

    console.log('Final filters generated:', filters);
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
    
    // Demographics filters
    if (newFilters.demographics?.district?.length) {
      queryParts.push(`in ${newFilters.demographics.district.join(' or ')} district`);
    }
    
    if (newFilters.demographics?.gender) {
      queryParts.push(`who are ${newFilters.demographics.gender.toLowerCase()}`);
    }
    
    if (newFilters.demographics?.religion) {
      queryParts.push(`who are ${newFilters.demographics.religion}`);
    }
    
    if (newFilters.demographics?.casteCategory) {
      queryParts.push(`from ${newFilters.demographics.casteCategory} category`);
    }
    
    if (newFilters.demographics?.maritalStatus) {
      queryParts.push(`who are ${newFilters.demographics.maritalStatus.toLowerCase()}`);
    }
    
    if (newFilters.demographics?.age?.min) {
      queryParts.push(`who are at least ${newFilters.demographics.age.min} years old`);
    }
    
    if (newFilters.demographics?.age?.max) {
      queryParts.push(`who are at most ${newFilters.demographics.age.max} years old`);
    }
    
    // Crop data filters
    if (newFilters.crop_data?.cropTypes?.length) {
      queryParts.push(`who grow ${newFilters.crop_data.cropTypes.join(' or ')}`);
    }
    
    if (newFilters.crop_data?.crops?.length) {
      queryParts.push(`who grow ${newFilters.crop_data.crops.join(' or ')}`);
    }
    
    if (newFilters.crop_data?.irrigationFacility) {
      queryParts.push("with irrigation facilities");
    }
    
    if (newFilters.crop_data?.landOwned?.min) {
      queryParts.push(`with at least ${newFilters.crop_data.landOwned.min} acres of land`);
    }
    
    if (newFilters.crop_data?.landOwned?.max) {
      queryParts.push(`with at most ${newFilters.crop_data.landOwned.max} acres of land`);
    }
    
    // Organization filters
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