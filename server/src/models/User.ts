import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: false, unique: true, sparse: true },
  googleId: { type: String, required: false },
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
