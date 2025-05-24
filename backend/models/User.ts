import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  name: string;
  age: number;
  level: number;
  university?: string; // Added
  major?: string; // Added
  graduationYear?: string; // Added
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  level: { type: Number, required: true },
  university: { type: String }, // Added
  major: { type: String }, // Added
  graduationYear: { type: String }, // Added
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
