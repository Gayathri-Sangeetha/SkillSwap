import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const myTeachSkills = currentUser.skillsToTeach?.map(s => 
      s.skill.toLowerCase().trim()
    ) || [];
    
    const myLearnSkills = currentUser.skillsToLearn?.map(s => 
      s.skill.toLowerCase().trim()
    ) || [];

    console.log("🎯 My Teach Skills:", myTeachSkills);
    console.log("📚 My Learn Skills:", myLearnSkills);

    if (myTeachSkills.length === 0 && myLearnSkills.length === 0) {
      console.log("❌ User has no skills defined");
      return res.status(200).json([]);
    }
    const orConditions = [];
    if (myLearnSkills.length > 0) {
      orConditions.push({
        skillsToTeach: {
          $elemMatch: {
            skill: { 
              $in:myLearnSkills
            }
          }
        }
      });
    }
    if (myTeachSkills.length > 0) {
      orConditions.push({
        skillsToLearn: {
          $elemMatch: {
            skill: { 
              $in:myTeachSkills
            }
          }
        }
      });
    }

    console.log("🔍 Search conditions:", JSON.stringify(orConditions, null, 2));
    const query = {
      $and: [
        { _id: { $ne: currentUserId } }, 
        { _id: { $nin: currentUser.friends || [] } }, 
        { _id: { $nin: currentUser.blockedUsers || [] } }, 
        { isOnboarded: true },
      ]
    };
    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const recommendedUsers = await User.find(query)
      .select("-password")
      .sort({ "rating.average": -1, sessionsHosted: -1 })
      .limit(20);

    console.log("✅ Found", recommendedUsers.length, "matching users");

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("❌ Error in getRecommendedUsers:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic skillsToTeach skillsToLearn");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // ✅ Check if user is blocked
    const currentUser = await User.findById(myId);
    if (currentUser.blockedUsers?.includes(recipientId)) {
      return res.status(400).json({ message: "You have blocked this user" });
    }
    if (recipient.blockedUsers?.includes(myId)) {
      return res.status(400).json({ message: "You cannot send a friend request to this user" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic skillsToTeach skillsToLearn");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic skillsToTeach skillsToLearn");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}