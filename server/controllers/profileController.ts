import { Request, Response } from "express";
import { storage } from "../storage";
import { hashPassword, comparePasswords } from "../auth";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { updateProfileSchema, updatePasswordSchema } from "@shared/schema";

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // We don't need to fetch the user again since req.user already has the data
    res.status(200).json({
      id: req.user.id,
      username: req.user.username,
      full_name: req.user.full_name
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Validate profile data
    const profileData = updateProfileSchema.parse(req.body);
    
    // Update user profile
    const updatedUser = await storage.updateUserProfile(req.user.id, profileData.full_name);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      full_name: updatedUser.full_name
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof ZodError) {
      // Format validation errors
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Validate password data
    const passwordData = updatePasswordSchema.parse(req.body);
    
    // Verify current password
    const isCurrentPasswordValid = await comparePasswords(
      passwordData.currentPassword,
      req.user.password
    );
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(passwordData.newPassword);
    
    // Update the password
    const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    
    if (error instanceof ZodError) {
      // Format validation errors
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: "Failed to update password" });
  }
};
