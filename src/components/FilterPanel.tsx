// components/FilterPanel.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FilterParams } from '../types';
import { filterOptions } from '../utils/mockData';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterParams;
  updateFilters: (filters: FilterParams) => void;
  totalResults: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, updateFilters, totalResults }) => {
  const [expanded, setExpanded] = React.useState(false);

  // Extract available options from the current results for dynamic filtering
  const availableOptions = useMemo(() => {
    // We're still using the static filterOptions, but in a real implementation
    // you might want to extract these from the API response metadata
    return filterOptions;
  }, []);

  const handleRemoveFilter = (category: keyof FilterParams, key: string, value?: any) => {
    const newFilters = { ...filters };
    
    if (category === 'demographics' && newFilters.demographics) {
      if (Array.isArray(newFilters.demographics[key as keyof typeof newFilters.demographics])) {
        // Handle array type filters (like district)
        const arrayKey = key as keyof typeof newFilters.demographics;
        const filterArray = newFilters.demographics[arrayKey] as string[];
        newFilters.demographics[arrayKey] = filterArray.filter(item => item !== value) as any;
        if ((newFilters.demographics[arrayKey] as any).length === 0) {
          delete newFilters.demographics[arrayKey];
        }
      } else {
        // Handle single value filters (like gender)
        delete newFilters.demographics[key as keyof typeof newFilters.demographics];
      }
      
      if (Object.keys(newFilters.demographics).length === 0) {
        delete newFilters.demographics;
      }
    }
    
    if (category === 'crop_data' && newFilters.crop_data) {
      if (Array.isArray(newFilters.crop_data[key as keyof typeof newFilters.crop_data])) {
        // Handle array type filters
        const arrayKey = key as keyof typeof newFilters.crop_data;
        const filterArray = newFilters.crop_data[arrayKey] as string[];
        newFilters.crop_data[arrayKey] = filterArray.filter(item => item !== value) as any;
        if ((newFilters.crop_data[arrayKey] as any).length === 0) {
          delete newFilters.crop_data[arrayKey];
        }
      } else {
        // Handle single value filters
        delete newFilters.crop_data[key as keyof typeof newFilters.crop_data];
      }
      
      if (Object.keys(newFilters.crop_data).length === 0) {
        delete newFilters.crop_data;
      }
    }
    
    if (category === 'organization' && newFilters.organization) {
      delete newFilters.organization[key as keyof typeof newFilters.organization];
      if (Object.keys(newFilters.organization).length === 0) {
        delete newFilters.organization;
      }
    }
    
    updateFilters(newFilters);
  };

  const getFilterCount = () => {
    let count = 0;
    
    if (filters.demographics) {
      Object.keys(filters.demographics).forEach(key => {
        const value = filters.demographics![key as keyof typeof filters.demographics];
        if (Array.isArray(value)) {
          count += value.length;
        } else if (value !== undefined) {
          count += 1;
        }
      });
    }
    
    if (filters.crop_data) {
      Object.keys(filters.crop_data).forEach(key => {
        const value = filters.crop_data![key as keyof typeof filters.crop_data];
        if (Array.isArray(value)) {
          count += value.length;
        } else if (value !== undefined) {
          if (key === 'landOwned') {
            if ((value as any).min !== undefined) count += 1;
            if ((value as any).max !== undefined) count += 1;
          } else {
            count += 1;
          }
        }
      });
    }
    
    if (filters.organization) {
      count += Object.keys(filters.organization).length;
    }
    
    if (filters.source) {
      count += Object.keys(filters.source).length;
    }
    
    return count;
  };

  const filterCount = getFilterCount();
  const hasFilters = filterCount > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-medium">Filters</h3>
              {hasFilters && (
                <p className="text-sm text-gray-500">{filterCount} active filter{filterCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {hasFilters && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilters({});
                }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            )}
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        
        {hasFilters && !expanded && (
          <div className="px-4 pb-4 pt-0 flex flex-wrap gap-2 animate-fade-in">
            {filters.demographics?.district?.map((district) => (
              <FilterBadge 
                key={`district-${district}`}
                label={`District: ${district}`}
                onRemove={() => handleRemoveFilter('demographics', 'district', district)}
              />
            ))}
            
            {filters.demographics?.gender && (
              <FilterBadge 
                label={`Gender: ${filters.demographics.gender}`}
                onRemove={() => handleRemoveFilter('demographics', 'gender')}
              />
            )}
            
            {filters.demographics?.religion && (
              <FilterBadge 
                label={`Religion: ${filters.demographics.religion}`}
                onRemove={() => handleRemoveFilter('demographics', 'religion')}
              />
            )}
            
            {filters.demographics?.maritalStatus && (
              <FilterBadge 
                label={`Marital Status: ${filters.demographics.maritalStatus}`}
                onRemove={() => handleRemoveFilter('demographics', 'maritalStatus')}
              />
            )}
            
            {filters.crop_data?.cropTypes?.map((type) => (
              <FilterBadge 
                key={`crop-type-${type}`}
                label={`Crop Type: ${type}`}
                onRemove={() => handleRemoveFilter('crop_data', 'cropTypes', type)}
              />
            ))}
            
            {filters.crop_data?.crops?.map((crop) => (
              <FilterBadge 
                key={`crop-${crop}`}
                label={`Crop: ${crop}`}
                onRemove={() => handleRemoveFilter('crop_data', 'crops', crop)}
              />
            ))}
            
            {filters.crop_data?.irrigationFacility !== undefined && (
              <FilterBadge 
                label={`Irrigation: ${filters.crop_data.irrigationFacility ? 'Yes' : 'No'}`}
                onRemove={() => handleRemoveFilter('crop_data', 'irrigationFacility')}
              />
            )}
            
            {filters.crop_data?.landOwned?.min !== undefined && (
              <FilterBadge 
                label={`Land: > ${filters.crop_data.landOwned.min} acres`}
                onRemove={() => {
                  const newFilters = { ...filters };
                  if (newFilters.crop_data?.landOwned) {
                    delete newFilters.crop_data.landOwned.min;
                    if (Object.keys(newFilters.crop_data.landOwned).length === 0) {
                      delete newFilters.crop_data.landOwned;
                    }
                  }
                  updateFilters(newFilters);
                }}
              />
            )}
            
            {filters.crop_data?.landOwned?.max !== undefined && (
              <FilterBadge 
                label={`Land: < ${filters.crop_data.landOwned.max} acres`}
                onRemove={() => {
                  const newFilters = { ...filters };
                  if (newFilters.crop_data?.landOwned) {
                    delete newFilters.crop_data.landOwned.max;
                    if (Object.keys(newFilters.crop_data.landOwned).length === 0) {
                      delete newFilters.crop_data.landOwned;
                    }
                  }
                  updateFilters(newFilters);
                }}
              />
            )}
            
            {filters.organization?.associatedWithFPO !== undefined && (
              <FilterBadge 
                label={`FPO: ${filters.organization.associatedWithFPO ? 'Yes' : 'No'}`}
                onRemove={() => handleRemoveFilter('organization', 'associatedWithFPO')}
              />
            )}
            
            {filters.organization?.fpoName && (
              <FilterBadge 
                label={`FPO: ${filters.organization.fpoName}`}
                onRemove={() => handleRemoveFilter('organization', 'fpoName')}
              />
            )}
          </div>
        )}
        
        {expanded && (
          <div className="border-t p-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-sm uppercase tracking-wider text-gray-500">Demographics</h4>
                <div className="space-y-2">
                  <FilterSelect 
                    label="District" 
                    options={availableOptions.demographics.district}
                    selected={filters.demographics?.district || []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.demographics) newFilters.demographics = {};
                      if (!newFilters.demographics.district) newFilters.demographics.district = [];
                      if (!newFilters.demographics.district.includes(value)) {
                        newFilters.demographics.district.push(value);
                      }
                      updateFilters(newFilters);
                    }}
                  />
                  
                  <FilterSelect 
                    label="Gender" 
                    options={availableOptions.demographics.gender}
                    selected={filters.demographics?.gender ? [filters.demographics.gender] : []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.demographics) newFilters.demographics = {};
                      newFilters.demographics.gender = value;
                      updateFilters(newFilters);
                    }}
                    singleSelect
                  />
                  
                  <FilterSelect 
                    label="Religion" 
                    options={availableOptions.demographics.religion}
                    selected={filters.demographics?.religion ? [filters.demographics.religion] : []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.demographics) newFilters.demographics = {};
                      newFilters.demographics.religion = value;
                      updateFilters(newFilters);
                    }}
                    singleSelect
                  />
                  
                  <FilterSelect 
                    label="Marital Status" 
                    options={availableOptions.demographics.maritalStatus}
                    selected={filters.demographics?.maritalStatus ? [filters.demographics.maritalStatus] : []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.demographics) newFilters.demographics = {};
                      newFilters.demographics.maritalStatus = value;
                      updateFilters(newFilters);
                    }}
                    singleSelect
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-sm uppercase tracking-wider text-gray-500">Crop Information</h4>
                <div className="space-y-2">
                  <FilterSelect 
                    label="Crop Types" 
                    options={availableOptions.crop_data.cropTypes}
                    selected={filters.crop_data?.cropTypes || []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.crop_data) newFilters.crop_data = {};
                      if (!newFilters.crop_data.cropTypes) newFilters.crop_data.cropTypes = [];
                      if (!newFilters.crop_data.cropTypes.includes(value)) {
                        newFilters.crop_data.cropTypes.push(value);
                      }
                      updateFilters(newFilters);
                    }}
                  />
                  
                  <FilterSelect 
                    label="Specific Crops" 
                    options={availableOptions.crop_data.crops}
                    selected={filters.crop_data?.crops || []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.crop_data) newFilters.crop_data = {};
                      if (!newFilters.crop_data.crops) newFilters.crop_data.crops = [];
                      if (!newFilters.crop_data.crops.includes(value)) {
                        newFilters.crop_data.crops.push(value);
                      }
                      updateFilters(newFilters);
                    }}
                  />
                  
                  <FilterSelect 
                    label="Irrigation" 
                    options={['Yes', 'No']}
                    selected={filters.crop_data?.irrigationFacility !== undefined ? 
                      [filters.crop_data.irrigationFacility ? 'Yes' : 'No'] : []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.crop_data) newFilters.crop_data = {};
                      newFilters.crop_data.irrigationFacility = value === 'Yes';
                      updateFilters(newFilters);
                    }}
                    singleSelect
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-sm uppercase tracking-wider text-gray-500">Organization</h4>
                <div className="space-y-2">
                  <FilterSelect 
                    label="FPO Association" 
                    options={['Yes', 'No']}
                    selected={filters.organization?.associatedWithFPO !== undefined ? 
                      [filters.organization.associatedWithFPO ? 'Yes' : 'No'] : []}
                    onChange={(value) => {
                      const newFilters = { ...filters };
                      if (!newFilters.organization) newFilters.organization = {};
                      newFilters.organization.associatedWithFPO = value === 'Yes';
                      updateFilters(newFilters);
                    }}
                    singleSelect
                  />
                  
                  {filters.organization?.associatedWithFPO && (
                    <FilterSelect 
                      label="FPO Name" 
                      options={availableOptions.organization.fpoName}
                      selected={filters.organization?.fpoName ? [filters.organization.fpoName] : []}
                      onChange={(value) => {
                        const newFilters = { ...filters };
                        if (!newFilters.organization) newFilters.organization = {};
                        newFilters.organization.fpoName = value;
                        updateFilters(newFilters);
                      }}
                      singleSelect
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-500">
          {totalResults > 0 ? (
            `${totalResults} farmer${totalResults !== 1 ? 's' : ''} found`
          ) : (
            'No farmers found matching your criteria'
          )}
        </p>
      </div>
    </div>
  );
};

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, onRemove }) => {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
      <span>{label}</span>
      <button 
        onClick={onRemove}
        className="ml-2 focus:outline-none" 
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  options: (string | boolean)[];
  selected: string[];
  onChange: (value: string) => void;
  singleSelect?: boolean;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ 
  label, options, selected, onChange, singleSelect 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm">{label}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </div>
      
      {isOpen && options.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto animate-slide-down">
          {options.map((option) => {
            const optionStr = option.toString();
            const isSelected = selected.includes(optionStr);
            
            return (
              <div 
                key={optionStr}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onChange(optionStr);
                  if (singleSelect) {
                    setIsOpen(false);
                  }
                }}
              >
                {optionStr}
              </div>
            );
          })}
          
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;