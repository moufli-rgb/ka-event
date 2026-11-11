import heroReceptionImg from './images/hero_african_wedding_reception_1794427009015.jpg';
import venueGardenImg from './images/service_venue_garden_hall_1794427009487.jpg';
import pastryCakeImg from './images/service_pastry_celebration_cake_1794427011206.jpg';
import cateringBuffetImg from './images/service_catering_gourmet_buffet_1794427012635.jpg';
import decorStageImg from './images/service_photography_decor_stage_1794427015096.jpg';
import giftHamperImg from './images/gift_luxury_hamper_box_1794427015112.jpg';

export const MEDIA = {
  heroReception: heroReceptionImg,
  venueGarden: venueGardenImg,
  pastryCake: pastryCakeImg,
  cateringBuffet: cateringBuffetImg,
  decorStage: decorStageImg,
  giftHamper: giftHamperImg,
} as const;

export type MediaKey = keyof typeof MEDIA;
