import { Request, Response } from "express";
import { storage } from "../storage";
import { csvService } from "../services/csvService";
import multer from "multer";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  }
});

export const exportShifts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get all user shifts
    const shifts = await storage.getShifts(req.user.id);
    
    // Generate CSV
    const csvBuffer = csvService.exportShiftsToCSV(shifts);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=shifts.csv');
    
    // Send CSV file
    res.status(200).send(csvBuffer);
  } catch (error: any) {
    console.error("Error exporting shifts:", error);
    res.status(500).json({ message: "Failed to export shifts" });
  }
};

export const importShifts = async (req: Request, res: Response) => {
  // Use multer to handle file upload
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: "Error uploading file", error: err.message });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Check file type
      if (req.file.mimetype !== 'text/csv') {
        return res.status(400).json({ message: "Invalid file type. Only CSV files are accepted" });
      }
      
      const csvContent = req.file.buffer.toString('utf-8');
      
      // Parse and validate CSV
      const { shifts, errors } = csvService.importShiftsFromCSV(csvContent, req.user.id);
      
      if (errors.length > 0 && shifts.length === 0) {
        return res.status(400).json({ message: "Invalid CSV format", errors });
      }
      
      // Import shifts
      const importedShifts = [];
      
      for (const shiftData of shifts) {
        try {
          const shift = await storage.createShift(shiftData as any);
          importedShifts.push(shift);
        } catch (error: any) {
          console.error("Error importing shift:", error);
          errors.push(`Failed to import shift: ${(error as Error).message}`);
        }
      }
      
      // Return results
      res.status(200).json({
        message: "Shifts imported successfully",
        imported: importedShifts.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error importing shifts:", error);
      res.status(500).json({ message: "Failed to import shifts" });
    }
  });
};
