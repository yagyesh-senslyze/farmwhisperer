export type Farmer = {
  id: string;
  name: string;
  contact: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  country: string;
  state: string;
  district: string;
  blockTaluka: string;
  village: string;
  pincode: string;
  religion: string;
  casteCategory: string;
  maritalStatus: string;
  bankAccountHolder: boolean;
  bankName: string;
  occupation: string;
  incomeRange: string;
  landOwned: number;
  cropTypes: string[];
  crops: string[];
  irrigationFacility: boolean;
  cropCultivationYear: number | null;
  farmMachineryOwned: string;
  associatedWithFPO: boolean;
  fpoName?: string;
  source: string;
};

export type FilterParams = {
  demographics?: {
    district?: string[];
    state?: string[];
    country?: string;
    blockTaluka?: string[];
    village?: string[];
    pincode?: string;
    gender?: string;
    age?: { min?: number; max?: number };
    religion?: string;
    casteCategory?: string;
    maritalStatus?: string;
    bankAccountHolder?: boolean;
    bankName?: string;
    occupation?: string;
    incomeRange?: string;
  };
  crop_data?: {
    cropTypes?: string[];
    crops?: string[];
    irrigationFacility?: boolean;
    landOwned?: { min?: number; max?: number };
    cropCultivationYear?: number;
    farmMachineryOwned?: string;
  };
  organization?: {
    associatedWithFPO?: boolean;
    fpoName?: string;
  };
  source?: {
    name?: string;
  };
};

export type NLPParseResult = {
  filters: FilterParams;
  originalQuery: string;
};

export type SortDirection = 'asc' | 'desc' | undefined;
export type SortConfig = {
  key: keyof Farmer | '';
  direction: SortDirection;
};

export type PaginationConfig = {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
};