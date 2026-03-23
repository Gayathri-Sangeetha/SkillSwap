import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
} from "../controllers/user.controller.js";
import User from "../models/User.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

// Get user profile by ID - MUST BE BEFORE /profile update route
router.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, location, timezone, profilePic, skillsToTeach, skillsToLearn } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (bio) updateData.bio = bio.trim();
    if (location) updateData.location = location;
    if (timezone) updateData.timezone = timezone;
    if (profilePic) updateData.profilePic = profilePic;
    if (skillsToTeach) updateData.skillsToTeach = skillsToTeach;
    if (skillsToLearn) updateData.skillsToLearn = skillsToLearn;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

// ===== BLOCK/UNBLOCK ROUTES =====

// Block a user
router.post("/block/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const blockUserId = req.params.id;

    // Can't block yourself
    if (userId.toString() === blockUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findById(userId);
    
    // Check if already blocked
    if (user.blockedUsers.includes(blockUserId)) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    // Add to blocked list
    user.blockedUsers.push(blockUserId);
    
    // Remove from friends if they were friends
    user.friends = user.friends.filter(id => id.toString() !== blockUserId);
    
    await user.save();

    res.status(200).json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Unblock a user
router.post("/unblock/:id", async (req, res) => {
  try {
    const userId = req.user._id;
    const unblockUserId = req.params.id;

    const user = await User.findById(userId);
    
    // Check if user is actually blocked
    if (!user.blockedUsers.includes(unblockUserId)) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    // Remove from blocked list
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== unblockUserId);
    await user.save();

    res.status(200).json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get list of blocked users
router.get("/blocked", async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .populate("blockedUsers", "fullName profilePic email");

    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    console.error("Error getting blocked users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;