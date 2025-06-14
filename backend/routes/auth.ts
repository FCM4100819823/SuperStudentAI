import express, { Router } from 'express';
import mongoose from 'mongoose';
import admin, { firestore } from '../firebase'; // Import from our centralized Firebase init
import { getAuth } from 'firebase-admin/auth';
import User from '../models/User'; // Ensure the User model is imported
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

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
  const {
    email,
    password,
    name,
    age,
    level,
    university,
    major,
    graduationYear,
  } = req.body;

  if (
    !email ||
    !password ||
    !name ||
    !age ||
    !level ||
    !university ||
    !major ||
    !graduationYear
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate level (Ghana university levels: 100 to 600)
  if (level < 100 || level > 600) {
    return res
      .status(400)
      .json({ message: 'Invalid level. Level must be between 100 and 600.' });
  }

  let userRecord; // Declare userRecord here to access it in catch block

  try {
    // Create user in Firebase Authentication
    console.log(`Attempting to create Firebase Auth user for email: ${email}`);
    userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });
    console.log(
      `Successfully created Firebase Auth user with UID: ${userRecord.uid} for email: ${email}`,
    );

    // Store additional user data in MongoDB
    console.log(
      `Attempting to save user data to MongoDB for UID: ${userRecord.uid}`,
    );
    const newUser = new User({
      username: userRecord.uid, // Use Firebase UID as username
      email,
      name,
      age,
      level,
      university, // Added
      major, // Added
      graduationYear, // Added
    });
    await newUser.save();
    console.log(
      `Successfully saved user data to MongoDB for UID: ${userRecord.uid}`,
    );

    // Sync to Firestore
    console.log(
      `Attempting to save user data to Firestore for UID: ${userRecord.uid}`,
    );
    await firestore.collection('users').doc(userRecord.uid).set({
      email,
      name,
      age,
      level,
      university,
      major,
      graduationYear,
      createdAt: new Date(),
    });
    console.log(
      `Successfully saved user data to Firestore for UID: ${userRecord.uid}`,
    );

    res.status(201).json({
      message: 'Signup successful',
      user: {
        uid: userRecord.uid,
        email,
        name,
        age,
        level,
        university,
        major,
        graduationYear,
      },
    });
  } catch (error: any) {
    // Ensure 'any' type for error object
    console.error('Error during signup process:', error); // Log the full error object

    let errorMessage = 'An unexpected error occurred during signup.';
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails = {};

    if (error.message) {
      errorMessage = error.message;
    }
    if (error.code) {
      errorCode = error.code;
    }

    if (userRecord && userRecord.uid) {
      console.error(
        `Firebase Auth user ${userRecord.uid} (email: ${email}) was created, but a subsequent step failed.`,
      );
      // If Auth user was created but DB write failed, this log confirms it.
      // The client will still receive an error because the overall process failed.
    } else {
      console.error(
        `Firebase Auth user creation failed for email: ${email} or error occurred before creation.`,
      );
    }

    // Specifically check for gRPC status code 5 (NOT_FOUND) which Firestore uses
    if (error.code === 5 && error.details !== undefined) {
      errorMessage =
        'Failed to save user details to the database. The user authentication record might have been created, but profile data is missing. Please contact support or try again later.';
      errorCode = 'FIRESTORE_SAVE_FAILED';
      // Safely access error.metadata and convert to string if it exists
      const metadataString =
        error.metadata && typeof error.metadata.toString === 'function'
          ? error.metadata.toString()
          : 'No metadata';
      errorDetails = { details: error.details, metadata: metadataString };
    }

    res.status(500).json({
      message: 'Error creating user',
      error: errorMessage,
      errorCode,
      errorDetails,
    });
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
        major: user.major, // Added
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
  const { name, age, level, university, major, graduationYear, email } =
    req.body;

  if (!idToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Validate fields
    if (level && (level < 100 || level > 600)) {
      return res
        .status(400)
        .json({ message: 'Invalid level. Level must be between 100 and 600.' });
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
        { new: true },
      );

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Sync to Firestore
      await firestore.collection('users').doc(uid).set(
        {
          email: updatedUser.email,
          name: updatedUser.name,
          age: updatedUser.age,
          level: updatedUser.level,
          university: updatedUser.university,
          major: updatedUser.major,
          graduationYear: updatedUser.graduationYear,
          updatedAt: new Date(),
        },
        { merge: true },
      );

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
