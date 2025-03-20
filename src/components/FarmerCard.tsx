// components/FarmerCard.tsx
import React from 'react';
import { Farmer } from '../types';
import { User, MapPin, Phone, Crop, Droplet, Users } from 'lucide-react';

interface FarmerCardProps {
  farmer: Farmer;
}

const FarmerCard: React.FC<FarmerCardProps> = ({ farmer }) => {
  // Handle potentially missing data
  const cropTypes = farmer.cropTypes || [];
  const crops = farmer.crops || [];
  
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg">{farmer.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <span>
                  {farmer.district || 'Unknown district'}
                  {farmer.state && `, ${farmer.state}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {farmer.gender || 'Unknown'}
            </div>
            {farmer.age > 0 && (
              <div className="text-xs mt-1 text-gray-500">Age: {farmer.age}</div>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
            {farmer.contact ? (
              <div className="flex items-center space-x-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{farmer.contact}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No contact information available</div>
            )}
            
            <div className="mt-3">
              {farmer.religion && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    <span className="w-2 h-2 bg-farm-orange rounded-full"></span>
                  </div>
                  <span className="text-sm">{farmer.religion}</span>
                </div>
              )}
              
              {farmer.casteCategory && (
                <div className="flex items-center space-x-2 text-gray-700 mt-1">
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    <span className="w-2 h-2 bg-farm-blue rounded-full"></span>
                  </div>
                  <span className="text-sm">{farmer.casteCategory}</span>
                </div>
              )}
              
              {farmer.maritalStatus && (
                <div className="flex items-center space-x-2 text-gray-700 mt-1">
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    <span className="w-2 h-2 bg-farm-yellow rounded-full"></span>
                  </div>
                  <span className="text-sm">{farmer.maritalStatus}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Farm Details</h4>
            {farmer.landOwned > 0 && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Crop className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{farmer.landOwned} acres</span>
              </div>
            )}
            
            <div className="mt-2">
              {cropTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {cropTypes.map((type, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-0.5 bg-farm-green/10 text-farm-green rounded text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
              
              {crops.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {crops.map((crop, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-0.5 bg-farm-brown/10 text-farm-brown rounded text-xs"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center mt-2">
              <Droplet className={`h-4 w-4 mr-2 ${farmer.irrigationFacility ? 'text-farm-blue' : 'text-gray-400'}`} />
              <span className="text-sm">
                {farmer.irrigationFacility ? 'Has irrigation' : 'No irrigation'}
              </span>
            </div>
          </div>
        </div>
        
        {farmer.associatedWithFPO && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium">
                Associated with {farmer.fpoName || 'an FPO'}
              </span>
            </div>
          </div>
        )}
        
        {farmer.source && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500">
              <span>Source: {farmer.source}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerCard;