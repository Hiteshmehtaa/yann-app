import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Driver / Car Service Icon
export const DriverIcon: React.FC<IconProps> = ({ size = 48, color = '#3B82F6' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M39 19L36 13H12L9 19M39 19H9M39 19V33C39 34.1046 38.1046 35 37 35H35M9 19V33C9 34.1046 9.89543 35 11 35H13M35 35C35 36.6569 33.6569 38 32 38C30.3431 38 29 36.6569 29 35M35 35C35 33.3431 33.6569 32 32 32C30.3431 32 29 33.3431 29 35M13 35C13 36.6569 14.3431 38 16 38C17.6569 38 19 36.6569 19 35M13 35C13 33.3431 14.3431 32 16 32C17.6569 32 19 33.3431 19 35M29 35H19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Pujari / Religious Service Icon
export const PujariIcon: React.FC<IconProps> = ({ size = 48, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 6L26 14L30 10L28 18L34 16L30 24L38 24L30 28L34 36L28 30L26 38L24 30L22 38L20 30L14 36L18 28L10 24L18 24L14 16L20 18L18 10L22 14L24 6Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M24 6L26 14L30 10L28 18L34 16L30 24M24 6L22 14L18 10L20 18L14 16L18 24M24 6V30M18 24L10 24L18 28L14 36L20 30L22 38L24 30M30 24L38 24L30 28L34 36L28 30L26 38L24 30"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Maid / Cleaning Service Icon
export const CleaningIcon: React.FC<IconProps> = ({ size = 48, color = '#8B5CF6' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="15" r="3" fill={color} opacity="0.2" />
    <Path
      d="M16 38L18 28L15 24V18H21L24 21L27 18H33V24L30 28L32 38M16 38H32M16 38H14M32 38H34"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="24" cy="15" r="3" stroke={color} strokeWidth="2.5" />
  </Svg>
);

// Baby Sitter Icon
export const BabySitterIcon: React.FC<IconProps> = ({ size = 48, color = '#EC4899' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 34C29.5228 34 34 29.5228 34 24C34 18.4772 29.5228 14 24 14C18.4772 14 14 18.4772 14 24C14 29.5228 18.4772 34 24 34Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M24 34C29.5228 34 34 29.5228 34 24C34 18.4772 29.5228 14 24 14C18.4772 14 14 18.4772 14 24C14 29.5228 18.4772 34 24 34Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 22C20 22 20.5 23 22 23C23.5 23 24 22 24 22M24 26C24 26 24.5 27 26 27C27.5 27 28 26 28 26"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="20" cy="24" r="1.5" fill={color} />
    <Circle cx="28" cy="24" r="1.5" fill={color} />
  </Svg>
);

// Nurse / Healthcare Icon
export const NurseIcon: React.FC<IconProps> = ({ size = 48, color = '#EF4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="18" y="18" width="12" height="12" rx="2" fill={color} opacity="0.2" />
    <Path
      d="M24 12V20M24 20V28M24 20H32M24 20H16"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 18L20 14H28L30 18M18 30L20 34H28L30 30"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x="18" y="18" width="12" height="12" rx="2" stroke={color} strokeWidth="2.5" />
  </Svg>
);

// Gardening / Landscaping Icon
export const GardeningIcon: React.FC<IconProps> = ({ size = 48, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 38V28M24 28C24 22 20 18 16 14C16 14 20 16 22 20C22 16 20 12 18 8C18 8 22 10 24 14M24 28C24 22 28 18 32 14C32 14 28 16 26 20C26 16 28 12 30 8C30 8 26 10 24 14"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 38H28C28 38 28 36 28 34C28 32 26 32 24 32C22 32 20 32 20 34C20 36 20 38 20 38Z"
      fill={color}
      opacity="0.2"
    />
  </Svg>
);

// Carpenter / Repairs Icon
export const CarpenterIcon: React.FC<IconProps> = ({ size = 48, color = '#F97316' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M12 24L24 12L36 24M18 24L24 18L30 24M24 24V38"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="24" cy="15" r="2" fill={color} />
    <Rect x="21" y="36" width="6" height="4" rx="1" fill={color} opacity="0.2" />
  </Svg>
);

// Electrician Icon
export const ElectricianIcon: React.FC<IconProps> = ({ size = 48, color = '#FCD34D' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M28 10L18 26H24L20 38L30 22H24L28 10Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M28 10L18 26H24L20 38L30 22H24L28 10Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </Svg>
);

// Plumber Icon
export const PlumberIcon: React.FC<IconProps> = ({ size = 48, color = '#3B82F6' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 10V18M24 18C20 18 18 20 18 24C18 28 20 30 24 30M24 18C28 18 30 20 30 24C30 28 28 30 24 30M24 30V38"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="24" cy="10" r="2" fill={color} />
    <Circle cx="24" cy="38" r="2" fill={color} />
    <Rect x="20" y="22" width="8" height="4" rx="1" fill={color} opacity="0.2" />
  </Svg>
);

// Delivery / Courier Icon
export const DeliveryIcon: React.FC<IconProps> = ({ size = 48, color = '#06B6D4' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="10" y="18" width="20" height="14" rx="2" fill={color} opacity="0.2" />
    <Path
      d="M10 20H30V30H10V20ZM30 22H36L38 26V30H30V22Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Circle cx="16" cy="32" r="2" stroke={color} strokeWidth="2.5" />
    <Circle cx="34" cy="32" r="2" stroke={color} strokeWidth="2.5" />
  </Svg>
);

// Pet Care Icon
export const PetCareIcon: React.FC<IconProps> = ({ size = 48, color = '#D946EF' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="20" cy="18" r="3" fill={color} opacity="0.3" />
    <Circle cx="28" cy="18" r="3" fill={color} opacity="0.3" />
    <Circle cx="16" cy="24" r="3" fill={color} opacity="0.3" />
    <Circle cx="32" cy="24" r="3" fill={color} opacity="0.3" />
    <Path
      d="M24 34C28.4183 34 32 30.4183 32 26C32 21.5817 28.4183 18 24 18C19.5817 18 16 21.5817 16 26C16 30.4183 19.5817 34 24 34Z"
      fill={color}
      opacity="0.2"
    />
    <Circle cx="20" cy="18" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="28" cy="18" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="16" cy="24" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="32" cy="24" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="24" cy="28" r="6" stroke={color} strokeWidth="2.5" />
  </Svg>
);

// Cook / Chef Icon
export const CookIcon: React.FC<IconProps> = ({ size = 48, color = '#EF4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M16 22H32V34C32 35.1046 31.1046 36 30 36H18C16.8954 36 16 35.1046 16 34V22Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M18 12V16M24 12V16M30 12V16M16 22H32V34C32 35.1046 31.1046 36 30 36H18C16.8954 36 16 35.1046 16 34V22ZM14 22H34V18C34 16.8954 33.1046 16 32 16H16C14.8954 16 14 16.8954 14 18V22Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Tutor / Education Icon
export const TutorIcon: React.FC<IconProps> = ({ size = 48, color = '#8B5CF6' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M12 20L24 14L36 20L24 26L12 20Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M12 20L24 14L36 20M12 20L24 26M12 20V30L24 36M36 20L24 26M36 20V30L24 36M24 26V36"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Security / Guard Icon
export const SecurityIcon: React.FC<IconProps> = ({ size = 48, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 38C24 38 36 32 36 22V14L24 10L12 14V22C12 32 24 38 24 38Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M24 38C24 38 36 32 36 22V14L24 10L12 14V22C12 32 24 38 24 38Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 24L22 26L28 20"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Painter Icon
export const PainterIcon: React.FC<IconProps> = ({ size = 48, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M14 34L20 28L28 36L22 42L14 34Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M28 12L36 20L20 36L12 28L28 12Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <Path
      d="M28 12L32 8M24 16L20 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Office / Professional Icon
export const OfficeIcon: React.FC<IconProps> = ({ size = 48, color = '#60A5FA' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="14" y="12" width="20" height="24" rx="2" fill={color} opacity="0.2" />
    <Rect x="14" y="12" width="20" height="24" rx="2" stroke={color} strokeWidth="2.5" />
    <Path
      d="M20 18H28M20 24H28M20 30H28"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// AC Repair / HVAC Icon
export const ACRepairIcon: React.FC<IconProps> = ({ size = 48, color = '#06B6D4' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="12" y="14" width="24" height="10" rx="2" fill={color} opacity="0.2" />
    <Rect x="12" y="14" width="24" height="10" rx="2" stroke={color} strokeWidth="2.5" />
    <Path
      d="M18 24V32M24 24V32M30 24V32M16 18H20M24 18H28"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Attendant / Personal Assistant Icon
export const AttendantIcon: React.FC<IconProps> = ({ size = 48, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="16" r="5" fill={color} opacity="0.2" />
    <Circle cx="24" cy="16" r="5" stroke={color} strokeWidth="2.5" />
    <Path
      d="M14 38V34C14 29.5817 17.5817 26 22 26H26C30.4183 26 34 29.5817 34 34V38"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Icon mapping for service names
const SERVICE_ICON_MAP: Record<string, React.FC<IconProps>> = {
  'driver': DriverIcon,
  'car': DriverIcon,
  'pujari': PujariIcon,
  'priest': PujariIcon,
  'clean': CleaningIcon,
  'maid': CleaningIcon,
  'toilet': CleaningIcon,
  'baby': BabySitterIcon,
  'sitter': BabySitterIcon,
  'nurse': NurseIcon,
  'healthcare': NurseIcon,
  'garden': GardeningIcon,
  'landscap': GardeningIcon,
  'carpenter': CarpenterIcon,
  'repair': CarpenterIcon,
  'electric': ElectricianIcon,
  'plumb': PlumberIcon,
  'delivery': DeliveryIcon,
  'courier': DeliveryIcon,
  'pet': PetCareIcon,
  'cook': CookIcon,
  'chef': CookIcon,
  'tutor': TutorIcon,
  'teacher': TutorIcon,
  'security': SecurityIcon,
  'guard': SecurityIcon,
  'paint': PainterIcon,
  'office': OfficeIcon,
  'chaprasi': OfficeIcon,
  'ac': ACRepairIcon,
  'hvac': ACRepairIcon,
  'attendant': AttendantIcon,
  'assistant': AttendantIcon,
};

// Get icon component by service name
export const getServiceIcon = (serviceName: string): React.FC<IconProps> => {
  const lowerName = serviceName.toLowerCase();
  
  // Find matching icon from map
  for (const [key, IconComponent] of Object.entries(SERVICE_ICON_MAP)) {
    if (lowerName.includes(key)) {
      return IconComponent;
    }
  }
  
  // Default icon
  return AttendantIcon;
};
