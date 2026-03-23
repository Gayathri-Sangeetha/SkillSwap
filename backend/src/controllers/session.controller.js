import Session from "../models/Session.js";
import User from "../models/User.js";

// Request a new session
export async function requestSession(req, res) {
  try {
    const learnerId = req.user._id;
    const { teacherId, skill, scheduledDate, duration, notes } = req.body;

    // Validation
    if (!teacherId || !skill || !scheduledDate) {
      return res.status(400).json({ 
        message: "Teacher, skill, and scheduled date are required" 
      });
    }

    // Can't request session with yourself
    if (learnerId.toString() === teacherId) {
      return res.status(400).json({ 
        message: "You cannot request a session with yourself" 
      });
    }

    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if teacher has this skill
    const hasSkill = teacher.skillsToTeach.some(
      (s) => s.skill.toLowerCase() === skill.toLowerCase()
    );
    
    if (!hasSkill) {
      return res.status(400).json({ 
        message: "This user does not teach the requested skill" 
      });
    }

    // Check if scheduled date is in the future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ 
        message: "Scheduled date must be in the future" 
      });
    }

    // Create session
    const session = await Session.create({
      teacher: teacherId,
      learner: learnerId,
      skill,
      scheduledDate: scheduledDateTime,
      duration: duration || 60,
      notes: notes || "",
      status: "pending",
    });

    const populatedSession = await Session.findById(session._id)
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic");

    res.status(201).json({ 
      success: true, 
      session: populatedSession 
    });
  } catch (error) {
    console.error("Error in requestSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get all sessions for current user (as teacher or learner)
export async function getMySessions(req, res) {
  try {
    const userId = req.user._id;
    const { status, role } = req.query; // role can be 'teacher' or 'learner'

    let query = {
      $or: [{ teacher: userId }, { learner: userId }],
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by role if provided
    if (role === "teacher") {
      query = { teacher: userId };
      if (status) query.status = status;
    } else if (role === "learner") {
      query = { learner: userId };
      if (status) query.status = status;
    }

    const sessions = await Session.find(query)
      .populate("teacher", "fullName profilePic skillsToTeach")
      .populate("learner", "fullName profilePic skillsToLearn")
      .sort({ scheduledDate: 1 }); // Sort by date ascending

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error in getMySessions controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get single session by ID
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id)
      .populate("teacher", "fullName profilePic email skillsToTeach")
      .populate("learner", "fullName profilePic email skillsToLearn");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session
    if (
      session.teacher._id.toString() !== userId.toString() &&
      session.learner._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({ 
        message: "You are not authorized to view this session" 
      });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error in getSessionById controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Confirm a pending session (teacher only)
export async function confirmSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only teacher can confirm
    if (session.teacher.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Only the teacher can confirm this session" 
      });
    }

    // Can only confirm pending sessions
    if (session.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot confirm a session with status: ${session.status}` 
      });
    }

    session.status = "confirmed";
    await session.save();

    const updatedSession = await Session.findById(id)
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic");

    res.status(200).json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error) {
    console.error("Error in confirmSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Start a session (change status to in-progress)
export async function startSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session
    if (
      session.teacher.toString() !== userId.toString() &&
      session.learner.toString() !== userId.toString()
    ) {
      return res.status(403).json({ 
        message: "You are not authorized to start this session" 
      });
    }

    // Can only start confirmed sessions
    if (session.status !== "confirmed") {
      return res.status(400).json({ 
        message: "Only confirmed sessions can be started" 
      });
    }

    // Check if it's close to scheduled time (within 10 minutes before or after)
    const now = new Date();
    const scheduledTime = new Date(session.scheduledDate);
    const timeDiff = Math.abs(now - scheduledTime) / (1000 * 60); // difference in minutes

    if (timeDiff > 10 && now < scheduledTime) {
      return res.status(400).json({ 
        message: "You can only start the session within 10 minutes of scheduled time" 
      });
    }

    session.status = "in-progress";
    await session.save();

    const updatedSession = await Session.findById(id)
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic");

    res.status(200).json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error) {
    console.error("Error in startSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Complete a session
export async function completeSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { learnerNotes, teacherNotes } = req.body;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session
    if (
      session.teacher.toString() !== userId.toString() &&
      session.learner.toString() !== userId.toString()
    ) {
      return res.status(403).json({ 
        message: "You are not authorized to complete this session" 
      });
    }

    // Can only complete in-progress sessions
    if (session.status !== "in-progress") {
      return res.status(400).json({ 
        message: "Only in-progress sessions can be completed" 
      });
    }

    session.status = "completed";
    
    // Update notes based on who is completing
    if (userId.toString() === session.learner.toString() && learnerNotes) {
      session.learnerNotes = learnerNotes;
    }
    
    if (userId.toString() === session.teacher.toString() && teacherNotes) {
      session.teacherNotes = teacherNotes;
    }

    await session.save();

    // Update user stats
    await User.findByIdAndUpdate(session.teacher, {
      $inc: { sessionsHosted: 1 }
    });

    await User.findByIdAndUpdate(session.learner, {
      $inc: { sessionsCompleted: 1 }
    });

    const updatedSession = await Session.findById(id)
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic");

    res.status(200).json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error) {
    console.error("Error in completeSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Cancel a session
export async function cancelSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { cancellationReason } = req.body;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session
    if (
      session.teacher.toString() !== userId.toString() &&
      session.learner.toString() !== userId.toString()
    ) {
      return res.status(403).json({ 
        message: "You are not authorized to cancel this session" 
      });
    }

    // Can't cancel completed sessions
    if (session.status === "completed") {
      return res.status(400).json({ 
        message: "Cannot cancel a completed session" 
      });
    }

    session.status = "cancelled";
    session.cancelledBy = userId;
    session.cancellationReason = cancellationReason || "";
    await session.save();

    const updatedSession = await Session.findById(id)
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic");

    res.status(200).json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error) {
    console.error("Error in cancelSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Rate a completed session (learner only)
export async function rateSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { rating, review } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only learner can rate
    if (session.learner.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Only the learner can rate this session" 
      });
    }

    // Can only rate completed sessions
    if (session.status !== "completed") {
      return res.status(400).json({ 
        message: "You can only rate completed sessions" 
      });
    }

    // Check if already rated
    if (session.rating) {
      return res.status(400).json({ 
        message: "You have already rated this session" 
      });
    }

    session.rating = rating;
    session.review = review || "";
    await session.save();

    // Update teacher's average rating
    const teacherId = session.teacher;
    const completedSessions = await Session.find({
      teacher: teacherId,
      status: "completed",
      rating: { $exists: true, $ne: null }
    });

    const totalRating = completedSessions.reduce((sum, s) => sum + s.rating, 0);
    const avgRating = totalRating / completedSessions.length;

    await User.findByIdAndUpdate(teacherId, {
      "rating.average": avgRating,
      "rating.count": completedSessions.length
    });

    const updatedSession = await Session.findById(id)
      .populate("teacher", "fullName profilePic rating")
      .populate("learner", "fullName profilePic");

    res.status(200).json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error) {
    console.error("Error in rateSession controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get upcoming sessions (within next 7 days)
export async function getUpcomingSessions(req, res) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sessions = await Session.find({
      $or: [{ teacher: userId }, { learner: userId }],
      status: { $in: ["confirmed", "pending"] },
      scheduledDate: {
        $gte: now,
        $lte: nextWeek
      }
    })
      .populate("teacher", "fullName profilePic")
      .populate("learner", "fullName profilePic")
      .sort({ scheduledDate: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error in getUpcomingSessions controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}