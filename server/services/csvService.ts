import { Shift } from "@shared/schema";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface CsvServiceInterface {
  exportShiftsToCSV(shifts: Shift[]): Buffer;
  importShiftsFromCSV(csvContent: string, userId: number): { shifts: Partial<Shift>[], errors: string[] };
}

class CsvService implements CsvServiceInterface {
  exportShiftsToCSV(shifts: Shift[]): Buffer {
    const data = shifts.map(shift => ({
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_time: shift.break_time,
      hourly_rate: shift.hourly_rate,
      notes: shift.notes || '',
      total_pay: shift.total_pay
    }));
    
    const csv = stringify(data, {
      header: true,
      columns: [
        'date',
        'start_time',
        'end_time',
        'break_time',
        'hourly_rate',
        'notes',
        'total_pay'
      ]
    });
    
    return Buffer.from(csv);
  }
  
  importShiftsFromCSV(csvContent: string, userId: number): { shifts: Partial<Shift>[], errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Parse CSV content
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Validate and transform records
      const shifts: Partial<Shift>[] = [];
      
      records.forEach((record: any, index: number) => {
        try {
          // Validate required fields
          if (!record.date || !record.start_time || !record.end_time || 
              !record.break_time || !record.hourly_rate) {
            errors.push(`Row ${index + 2}: Missing required fields`);
            return;
          }
          
          // Convert numeric fields
          const breakTime = parseFloat(record.break_time);
          const hourlyRate = parseFloat(record.hourly_rate);
          
          if (isNaN(breakTime) || isNaN(hourlyRate)) {
            errors.push(`Row ${index + 2}: Invalid numeric values`);
            return;
          }
          
          // Calculate total pay
          // Note: In a real implementation, we would use a utility function
          // that matches the calculation logic in the application
          const startTime = new Date(`1970-01-01T${record.start_time}`);
          const endTime = new Date(`1970-01-01T${record.end_time}`);
          let hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          hours -= breakTime;
          const totalPay = hours * hourlyRate;
          
          shifts.push({
            user_id: userId,
            date: record.date,
            start_time: record.start_time,
            end_time: record.end_time,
            break_time: breakTime,
            hourly_rate: hourlyRate,
            total_pay: totalPay,
            notes: record.notes || ''
          });
          
        } catch (error) {
          errors.push(`Row ${index + 2}: Invalid data format`);
        }
      });
      
      return { shifts, errors };
      
    } catch (error) {
      errors.push('Failed to parse CSV file. Please ensure it is properly formatted.');
      return { shifts: [], errors };
    }
  }
}

export const csvService = new CsvService();
