import type { BusinessCategory, BusinessDay, BusinessSchedule } from './types';

export const emptySchedule: BusinessSchedule = {
  monday: { enabled: false, open: '', close: '' },
  tuesday: { enabled: false, open: '', close: '' },
  wednesday: { enabled: false, open: '', close: '' },
  thursday: { enabled: false, open: '', close: '' },
  friday: { enabled: false, open: '', close: '' },
  saturday: { enabled: false, open: '', close: '' },
  sunday: { enabled: false, open: '', close: '' }
};

export const businessCategories: BusinessCategory[] = [
  { id: 'reposteria', name: 'Reposteria y Pasteleria', icon: '🎂' },
  { id: 'comida', name: 'Comida y Restaurantes', icon: '🍽️' },
  { id: 'servicios', name: 'Servicios Profesionales', icon: '🔧' },
  { id: 'belleza', name: 'Belleza y Estetica', icon: '💅' },
  { id: 'hogar', name: 'Hogar y Construccion', icon: '🏠' },
  { id: 'salud', name: 'Salud y Bienestar', icon: '💊' },
  { id: 'educacion', name: 'Educacion', icon: '📚' },
  { id: 'tecnologia', name: 'Tecnologia', icon: '💻' },
  { id: 'eventos', name: 'Eventos y Entretenimiento', icon: '🎉' },
  { id: 'otros', name: 'Otros', icon: '📦' }
];

export const businessDays: BusinessDay[] = [
  { id: 'monday', name: 'Lunes' },
  { id: 'tuesday', name: 'Martes' },
  { id: 'wednesday', name: 'Miercoles' },
  { id: 'thursday', name: 'Jueves' },
  { id: 'friday', name: 'Viernes' },
  { id: 'saturday', name: 'Sabado' },
  { id: 'sunday', name: 'Domingo' }
];
