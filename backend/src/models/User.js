import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    // profilePic: {
    //   type: String,
    //   default: "",
    // },    
    // NEW: Skills system
    skillsToTeach: [{
      skill: { type: String, required: true },
      level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      verified: { type: Boolean, default: false }
    }],
    
    skillsToLearn: [{
      skill: { type: String, required: true },
      level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner'
      }
    }],
    
    // NEW: Location and timezone
    location: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    
    // NEW: Availability
    availability: [{
      day: { 
        type: String, 
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // Format: "09:00"
      endTime: String,   // Format: "17:00"
    }],
    
    // NEW: Rating system
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    
    // NEW: Stats
    sessionsCompleted: {
      type: Number,
      default: 0
    },
    
    sessionsHosted: {
      type: Number,
      default: 0
    },
    
    // EXISTING FIELD
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    
    // EXISTING FIELD
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    
    // NEW: Blocked users
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;