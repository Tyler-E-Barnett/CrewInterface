// types.ts
export interface TimeBlock {
  _id: string;
  contextKey: string;
  contextType: string;
  itemId: string;
  createdAt: string;
  end: string;
  fmRecordId: string;
  locationId: string;
  start: string;
  updatedAt: string;
}

export interface Assembly {
  _id: string;
  fmRecordId: string;
  __v: number;
  aisleOrArea: string;
  assemblyId: string;
  assemblyType: string;
  bay: string;
  createdAt: string;
  description: string;
  id: string;
  incidentals: string;
  notes: string;
  shelfOrBin: string;
  status: string;
  statusNotes: string;
  updatedAt: string;
  timeblocks: TimeBlock[];
}

export interface AvailabilityDetails {
  _id: string;
  fmRecordId: string;
  __v: number;
  aisleOrArea: string;
  assemblyId: string;
  assemblyType: string;
  bay: string;
  createdAt: string;
  description: string;
  id: string;
  incidentals: string;
  notes: string;
  shelfOrBin: string;
  status: string;
  statusNotes: string;
  updatedAt: string;
  timeblocks: TimeBlock[];
}

export interface Availability {
  totalAssemblies: number;
  availableAssemblies: number;
  unavailableAssemblies: number;
  unavailableDetails: AvailabilityDetails[];
}

export interface SubItem {
  _id: string;
  code: string;
  category: string;
  tags: string[];
  assemblies: Assembly[];
  createdAt: string;
  updatedAt: string;
  availability: Availability;
}

export interface ItemDetails {
  _id: string;
  code: string;
  type: string;
  category: string;
  costingDepartment: string;
  contractDescription: string;
  tags: string[];
  subItems: SubItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceFormProps {
  pricing: {
    unitPrice: number | string;
    defaultQuantity: number;
    minimumQuantity: number;
    maximumQuantity: number;
    basePrice: number | string;
    baseAdjust: number | string;
    baseDiscount: number | string;
    unitAdjust: number | string;
    unitDiscount: number | string;
    termFactor: {
      "2D": number;
      "3D": number;
      BW: number;
      FW: number;
      "10D": number;
      M: number;
    };
    level: string;
  };
  handlePricingChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleTermFactorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  levelNames: any[];
  addPricingLevel?: () => void;
  isEditing?: boolean;
}

export interface PricingProps {
  pricing: {
    unitPrice: number | string;
    defaultQuantity: number | string;
    minimumQuantity: number | string;
    maximumQuantity: number | string;
    basePrice: number | string;
    baseAdjust: number | string;
    baseDiscount: number | string;
    unitAdjust: number | string;
    unitDiscount: number | string;
    termFactor: {
      "2D": number;
      "3D": number;
      BW: number;
      FW: number;
      "10D": number;
      M: number;
    };
    level: string;
  };
  setPricing: React.Dispatch<React.SetStateAction<any>>;
  pricingLevels: any[];
  setPricingLevels: React.Dispatch<React.SetStateAction<any[]>>;
  removedPricingLevels: string[];
  setRemovedPricingLevels: React.Dispatch<React.SetStateAction<string[]>>;
  levelNames: any[];
}
