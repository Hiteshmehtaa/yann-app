import { ImageSourcePropType } from 'react-native';

// Service icon images - All available icons
export const SERVICE_IMAGES: Record<string, ImageSourcePropType> = {
    ganeshPuja: require('../../assets/service-icons/Ganeshpuja.png'),
    mahamrityunjay: require('../../assets/service-icons/Mahamrityunjay.png'),
    lakshmiPooja: require('../../assets/service-icons/Lakshmi Pooja.png'),
    satyanarayanKatha: require('../../assets/service-icons/Satyanarayan Katha.png'),
    lordVishnu: require('../../assets/service-icons/Lord Vishnu Pooja.png'),
    vishnu: require('../../assets/service-icons/Vishnu.png'),
    ringCeremony: require('../../assets/service-icons/Ring Ceremony.png'),
    bhoomiPoojan: require('../../assets/service-icons/Bhoomi Poojan.png'),
    shraadh: require('../../assets/service-icons/Shraadh Karm.png'),
    janmdin: require('../../assets/service-icons/Janmdin Poojan.png'),
    sundarkaand: require('../../assets/service-icons/Sundarkaand Paath.png'),
    deepHouseCleaning: require('../../assets/service-icons/Deep House Cleaning.png'),
    houseCleaning: require('../../assets/service-icons/House Cleaning.png'),
    bathroomCleaning: require('../../assets/service-icons/Deep Bathroom Cleaning.png'),
    carCleaning: require('../../assets/service-icons/Car Cleaning.png'),
    laundry: require('../../assets/service-icons/Laundary And Iron.png'),
    dryCleaning: require('../../assets/service-icons/Dry Cleaning.png'),
    chimneyCleaning: require('../../assets/service-icons/Chimney Cleaning.png'),
    tankCleaning: require('../../assets/service-icons/Tank Cleaning.png'),
};

// Function to get icon image based on service title or category
export const getServiceIconImage = (serviceTitle: string): ImageSourcePropType | undefined => {
    const title = serviceTitle.toLowerCase();

    // Pujari Services
    if (title.includes('ganesh')) return SERVICE_IMAGES.ganeshPuja;
    if (title.includes('lakshmi') || title.includes('laxmi')) return SERVICE_IMAGES.lakshmiPooja;
    if (title.includes('satyanarayan') || title.includes('katha')) return SERVICE_IMAGES.satyanarayanKatha;
    if (title.includes('mahamrityunjay') || title.includes('mrityunjay')) return SERVICE_IMAGES.mahamrityunjay;
    if (title.includes('griha pravesh') || title.includes('housewarming') || title.includes('grihapravesh')) return SERVICE_IMAGES.lordVishnu;
    if (title.includes('vastu')) return SERVICE_IMAGES.vishnu;
    if (title.includes('ring ceremony') || title.includes('engagement')) return SERVICE_IMAGES.ringCeremony;
    if (title.includes('bhoomi')) return SERVICE_IMAGES.bhoomiPoojan;
    if (title.includes('shraddh') || title.includes('shraadh')) return SERVICE_IMAGES.shraadh;
    if (title.includes('janmadin') || title.includes('birthday')) return SERVICE_IMAGES.janmdin;
    if (title.includes('sundarkand') || title.includes('sundarkaand')) return SERVICE_IMAGES.sundarkaand;

    // Cleaning Services
    if (title.includes('deep') && title.includes('house')) return SERVICE_IMAGES.deepHouseCleaning;
    if (title.includes('bathroom')) return SERVICE_IMAGES.bathroomCleaning;
    if (title.includes('house') && title.includes('clean')) return SERVICE_IMAGES.houseCleaning;
    if (title.includes('car') && title.includes('wash') || title.includes('car') && title.includes('clean')) return SERVICE_IMAGES.carCleaning;
    if (title.includes('laundry') || title.includes('ironing')) return SERVICE_IMAGES.laundry;
    if (title.includes('dry clean')) return SERVICE_IMAGES.dryCleaning;
    if (title.includes('chimney') || title.includes('exhaust')) return SERVICE_IMAGES.chimneyCleaning;
    if (title.includes('tank') && title.includes('clean') || title.includes('water tank')) return SERVICE_IMAGES.tankCleaning;

    // Fallback for general puja/cleaning
    if (title.includes('puja') || title.includes('pooja') || title.includes('havan') || title.includes('pujari')) return SERVICE_IMAGES.ganeshPuja;
    if (title.includes('clean') || title.includes('maid')) return SERVICE_IMAGES.houseCleaning;

    return undefined;
};

