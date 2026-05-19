export type ScheduleDayId =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
};

export type BusinessSchedule = Record<ScheduleDayId, DaySchedule>;

export type BusinessCategory = {
  id: string;
  name: string;
  icon: string;
};

export type BusinessDay = {
  id: ScheduleDayId;
  name: string;
};
