import express, { Router } from 'express';
import mongoose from 'mongoose';
import admin from '../firebase'; // Import from our centralized Firebase init
import { getAuth } from 'firebase-admin/auth';
import User from '../models/User'; // Ensure the User model is imported
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const router = Router(); // Use Router directly to avoid type mismatches

// Login route
router.post('/login', async (req: ExpressRequest, res: ExpressResponse) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Firebase Authentication handles login client-side
    res.status(200).json({ message: 'Login handled by Firebase client SDK' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Signup route
router.post('/signup', async (req: ExpressRequest, res: ExpressResponse) => {
  const { email, password, name, age, level, university, major, graduationYear } = req.body;

  if (!email || !password || !name || !age || !level || !university || !major || !graduationYear) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate level (Ghana university levels: 100 to 600)
  if (level < 100 || level > 600) {
    return res.status(400).json({ message: 'Invalid level. Level must be between 100 and 600.' });
  }

  try {
    // Create user in Firebase Authentication
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional user data in MongoDB
    const newUser = new User({
      username: userRecord.uid, // Use Firebase UID as username
      email,
      name,
      age,
      level,
      university, // Added
      major,      // Added
      graduationYear, // Added
    });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful', user: { uid: userRecord.uid, email, name, age, level, university, major, graduationYear } });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Profile route
router.get('/profile', async (req: ExpressRequest, res: ExpressResponse) => {
  const idToken = req.headers.authorization?.split(' ')[1];

  if (!idToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const user = await User.findOne({ username: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',
      user: {
        email: user.email,
        name: user.name,
        age: user.age,
        level: user.level,
        university: user.university, // Added
        major: user.major,          // Added
        graduationYear: user.graduationYear, // Added
      },
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token', error });
  }
});

// Update profile route
router.put('/profile', async (req: ExpressRequest, res: ExpressResponse) => {
  const idToken = req.headers.authorization?.split(' ')[1];
  const { name, age, level, university, major, graduationYear, email } = req.body;

  if (!idToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Validate fields
    if (level && (level < 100 || level > 600)) {
      return res.status(400).json({ message: 'Invalid level. Level must be between 100 and 600.' });
    }

    if (age && (typeof age !== 'number' || age <= 0)) {
      return res.status(400).json({ message: 'Invalid age.' });
    }

    // Update user in Firebase Auth if email or name changed
    if (email || name) {
      const updateParams: any = {};
      if (email) updateParams.email = email;
      if (name) updateParams.displayName = name;
      
      await getAuth().updateUser(uid, updateParams);
    }

    // Update user in MongoDB
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (age) updateData.age = age;
    if (level) updateData.level = level;
    if (university) updateData.university = university;
    if (major) updateData.major = major;
    if (graduationYear) updateData.graduationYear = graduationYear;

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { username: uid },
        { $set: updateData },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          age: updatedUser.age,
          level: updatedUser.level,
          university: updatedUser.university,
          major: updatedUser.major,
          graduationYear: updatedUser.graduationYear,
        },
      });
    } else {
      return res.status(400).json({ message: 'No fields to update' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Error updating profile', error });
  }
});

export default router;
