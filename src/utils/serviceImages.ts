import { ImageSourcePropType } from 'react-native';

// Service icon images - Load all icons
export const SERVICE_IMAGES: Record<string, ImageSourcePropType> = {
    // Using existing available icons as placeholders for missing ones
    repair: require('../../assets/service-icons/Ganeshpuja.png'), // Placeholder
    baby: require('../../assets/service-icons/Ganeshpuja.png'),   // Placeholder
    cleaning: require('../../assets/service-icons/Ganeshpuja.png'), // Placeholder
    food: require('../../assets/service-icons/Ganeshpuja.png'),     // Placeholder
    driver: require('../../assets/service-icons/Ganeshpuja.png'),   // Placeholder

    // Puja icons
    puja1: require('../../assets/service-icons/Ganeshpuja.png'),
    puja2: require('../../assets/service-icons/Ganeshpuja.png'),
    puja3: require('../../assets/service-icons/Mahamrityunjay.png'), // Mapped to Mahamrityunjay
    puja4: require('../../assets/service-icons/Ganeshpuja.png'),
    puja5: require('../../assets/service-icons/Ganeshpuja.png'), // Mapped to Ganesh
    puja6: require('../../assets/service-icons/Ganeshpuja.png'),
};

// Function to get icon image based on service title or category
export const getServiceIconImage = (serviceTitle: string): ImageSourcePropType | undefined => {
    const title = serviceTitle.toLowerCase();

    // Driver Services
    if (title.includes('driver') || title.includes('driving')) {
        return SERVICE_IMAGES.driver;
    }

    // Specific Puja Services with unique icons
    if (title.includes('ganesh')) {
        return SERVICE_IMAGES.puja5; // Ganesh image
    }
    if (title.includes('lakshmi') || title.includes('laxmi')) {
        return SERVICE_IMAGES.puja6; // Lakshmi image
    }
    if (title.includes('shiv') || title.includes('shiva') || title.includes('mahashivratri')) {
        return SERVICE_IMAGES.puja3; // Shivling image
    }
    if (title.includes('satyanarayan') || title.includes('katha')) {
        return SERVICE_IMAGES.puja4; // Diya/Lamp image
    }
    if (title.includes('griha pravesh') || title.includes('housewarming') || title.includes('grihapravesh') || title.includes('vastu')) {
        return SERVICE_IMAGES.puja2; // Kalash image
    }

    // General Puja Services
    if (title.includes('puja') || title.includes('pujari') || title.includes('pooja') ||
        title.includes('havan') || title.includes('ceremony') || title.includes('religious') ||
        title.includes('aarti') || title.includes('worship')) {
        return SERVICE_IMAGES.puja1; // General puja items
    }

    // Repairs & Maintenance
    if (title.includes('repair') || title.includes('maintenance') ||
        title.includes('ac service') || title.includes('ro service') ||
        title.includes('refrigerator') || title.includes('air purifier') ||
        title.includes('chimney') || title.includes('technician')) {
        return SERVICE_IMAGES.repair;
    }

    // Childcare
    if (title.includes('baby') || title.includes('sitter') || title.includes('childcare')) {
        return SERVICE_IMAGES.baby;
    }

    // Cleaning
    if (title.includes('maid') || title.includes('clean') || title.includes('toilet')) {
        return SERVICE_IMAGES.cleaning;
    }

    // Food Service
    if (title.includes('cook') || title.includes('catering') || title.includes('chef') ||
        title.includes('food') || title.includes('kitchen')) {
        return SERVICE_IMAGES.food;
    }

    return undefined;
};
