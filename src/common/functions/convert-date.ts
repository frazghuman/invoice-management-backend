import * as moment from 'moment';
export function convertToStartAndEndOfDayInUTC(dateString: string): { startOfDayUTC: Date, endOfDayUTC: Date } {
    // Parse the input date with timezone
    const localDate = moment.parseZone(dateString);
  
    // Get the start of the day in the local timezone
    const startOfDay = localDate.clone().startOf('day');
    // Get the end of the day in the local timezone
    const endOfDay = localDate.clone().endOf('day');
  
    // Convert to UTC
    const startOfDayUTC = startOfDay.utc().toDate();
    const endOfDayUTC = endOfDay.utc().toDate();
  
    return { startOfDayUTC, endOfDayUTC };
}
