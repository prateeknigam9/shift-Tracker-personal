import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
};

// Admin middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Checking if user has admin privileges (id = 1 or isAdmin flag)
  if (req.user?.id === 1 || req.user?.is_admin) {
    return next();
  }
  
  res.status(403).json({ message: 'Admin privileges required' });
};
