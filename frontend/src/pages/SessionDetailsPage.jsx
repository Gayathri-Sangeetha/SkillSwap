import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getSessionById, 
  confirmSession, 
  startSession,
  completeSession, 
  cancelSession,
  rateSession 
} from "../lib/api";
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  StarIcon,
  MessageSquareIcon,
  LoaderIcon,
  VideoIcon
} from "lucide-react";
import { useState } from "react";
import PageLoader from "../components/PageLoader";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

const SessionDetailsPage = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [learnerNotes, setLearnerNotes] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSessionById(sessionId),
  });

  const { mutate: confirmMutation, isPending: confirming } = useMutation({
    mutationFn: () => confirmSession(sessionId),
    onSuccess: () => {
      toast.success("Session confirmed! 🎉");
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingSessions"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to confirm session");
    },
  });

  const { mutate: startMutation, isPending: starting } = useMutation({
    mutationFn: () => startSession(sessionId),
    onSuccess: () => {
      toast.success("Session started! Starting video call...");
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      // Navigate to call page
      const channelId = [session.teacher._id, session.learner._id].sort().join("-");
      navigate(`/call/${channelId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to start session");
    },
  });

  const { mutate: completeMutation, isPending: completing } = useMutation({
    mutationFn: () => completeSession(sessionId, { learnerNotes, teacherNotes }),
    onSuccess: () => {
      toast.success("Session completed! 🎓");
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to complete session");
    },
  });

  const { mutate: cancelMutation, isPending: cancelling } = useMutation({
    mutationFn: () => cancelSession(sessionId, cancellationReason),
    onSuccess: () => {
      toast.success("Session cancelled");
      setShowCancelModal(false);
      setCancellationReason("");
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel session");
    },
  });

  const { mutate: rateMutation, isPending: isRating } = useMutation({
    mutationFn: () => rateSession(sessionId, { rating, review }),
    onSuccess: () => {
      toast.success("Thank you for your feedback! ⭐");
      setShowRateModal(false);
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit rating");
    },
  });

  if (isLoading) return <PageLoader />;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="opacity-70 mb-4">This session doesn't exist</p>
          <Link to="/sessions" className="btn btn-primary">View All Sessions</Link>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Determine role with .toString()
  const isTeacher = authUser?._id?.toString() === session.teacher._id?.toString();
  const isLearner = authUser?._id?.toString() === session.learner._id?.toString();
  const otherUser = isTeacher ? session.learner : session.teacher;
  const myRole = isTeacher ? "teacher" : "learner";

  // ✅ NEW: Check if friends
  const isFriend = authUser?.friends?.some(
    friendId => friendId.toString() === otherUser._id.toString()
  );

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Check if can start
  const canStart = () => {
    if (session.status !== "confirmed") return false;
    const scheduledTime = new Date(session.scheduledDate);
    const now = new Date();
    const timeDiff = Math.abs(scheduledTime - now) / (1000 * 60);
    return timeDiff <= 10;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: "text-warning",
      confirmed: "text-success",
      "in-progress": "text-info",
      completed: "text-neutral",
      cancelled: "text-error",
    };
    return colors[status] || "";
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl">
        
        {/* BACK BUTTON */}
        <button onClick={() => navigate("/sessions")} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Sessions
        </button>

        {/* SESSION HEADER */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* OTHER USER INFO */}
              <div className="flex items-start gap-4 flex-1">
                <div className="avatar">
                  <div className="size-20 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200">
                    <img src={otherUser.profilePic} alt={otherUser.fullName} />
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">{session.skill}</h1>
                  <p className="opacity-70 mb-3">
                    {isTeacher ? "Teaching" : "Learning from"} {otherUser.fullName}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-4" />
                      <span>{formatDate(session.scheduledDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="size-4" />
                      <span>{session.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-4" />
                      <span className="capitalize">You are the {myRole}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUS BADGE */}
              <div className="flex flex-col items-center gap-2">
                <div className={`text-6xl ${getStatusColor(session.status)}`}>
                  {session.status === "pending" && <ClockIcon />}
                  {session.status === "confirmed" && <CheckCircleIcon />}
                  {session.status === "in-progress" && <PlayCircleIcon />}
                  {session.status === "completed" && <CheckCircleIcon />}
                  {session.status === "cancelled" && <XCircleIcon />}
                </div>
                <span className={`badge badge-lg ${getStatusColor(session.status)}`}>
                  {session.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SESSION DETAILS */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          
          {/* SESSION NOTES */}
          {session.notes && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Session Goals</h2>
                <p className="opacity-80">{session.notes}</p>
              </div>
            </div>
          )}

          {/* LEARNER NOTES */}
          {session.learnerNotes && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Learner's Notes</h2>
                <p className="opacity-80">{session.learnerNotes}</p>
              </div>
            </div>
          )}

          {/* TEACHER NOTES */}
          {session.teacherNotes && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Teacher's Notes</h2>
                <p className="opacity-80">{session.teacherNotes}</p>
              </div>
            </div>
          )}

          {/* RATING */}
          {session.rating && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg">Rating</h2>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`size-6 ${
                        i < session.rating ? "fill-warning text-warning" : "text-base-300"
                      }`}
                    />
                  ))}
                  <span className="text-xl font-bold ml-2">{session.rating}/5</span>
                </div>
                {session.review && <p className="opacity-80">{session.review}</p>}
              </div>
            </div>
          )}
        </div>

        {/* CANCELLATION INFO */}
        {session.status === "cancelled" && session.cancellationReason && (
          <div className="alert alert-error mb-6">
            <div className="flex-col items-start w-full">
              <p className="font-semibold">Cancellation Reason:</p>
              <p>{session.cancellationReason}</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-6">
            <h2 className="card-title mb-4">Actions</h2>
            
            <div className="flex flex-wrap gap-3">
              
              {/* PENDING - TEACHER CAN CONFIRM */}
              {session.status === "pending" && isTeacher && (
                <button
                  onClick={() => confirmMutation()}
                  disabled={confirming}
                  className="btn btn-success"
                >
                  {confirming ? (
                    <>
                      <LoaderIcon className="size-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="size-4 mr-2" />
                      Confirm Session
                    </>
                  )}
                </button>
              )}

              {/* CONFIRMED - CAN START (WITHIN 10 MINS) */}
              {session.status === "confirmed" && canStart() && (
                <button
                  onClick={() => startMutation()}
                  disabled={starting}
                  className="btn btn-primary btn-lg"
                >
                  {starting ? (
                    <>
                      <LoaderIcon className="size-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <VideoIcon className="size-5 mr-2" />
                      Start Video Call
                    </>
                  )}
                </button>
              )}

              {/* IN-PROGRESS - CAN COMPLETE */}
              {session.status === "in-progress" && (
                <button
                  onClick={() => completeMutation()}
                  disabled={completing}
                  className="btn btn-success"
                >
                  {completing ? (
                    <>
                      <LoaderIcon className="size-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="size-4 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </button>
              )}

              {/* COMPLETED - LEARNER CAN RATE */}
              {session.status === "completed" && !session.rating && isLearner && (
                <button
                  onClick={() => setShowRateModal(true)}
                  className="btn btn-warning"
                >
                  <StarIcon className="size-4 mr-2" />
                  Rate & Review
                </button>
              )}

              {/* ✅ FIXED: MESSAGE OTHER USER - ONLY IF FRIENDS */}
              {session.status !== "cancelled" && isFriend && (
                <Link
                  to={`/chat/${otherUser._id}`}
                  className="btn btn-outline"
                >
                  <MessageSquareIcon className="size-4 mr-2" />
                  Message {otherUser.fullName}
                </Link>
              )}

              {/* CANCEL SESSION */}
              {(session.status === "pending" || session.status === "confirmed") && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-error btn-outline ml-auto"
                >
                  <XCircleIcon className="size-4 mr-2" />
                  Cancel Session
                </button>
              )}
            </div>

            {/* TIME WARNING */}
            {session.status === "confirmed" && !canStart() && (
              <div className="alert alert-info mt-4">
                <p>
                  You can start the video call within 10 minutes of the scheduled time
                  ({formatDate(session.scheduledDate)})
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CANCEL MODAL */}
        {showCancelModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Cancel Session</h3>
              <p className="mb-4">Are you sure you want to cancel this session?</p>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Reason (optional)</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="textarea textarea-bordered h-24"
                  placeholder="Let the other person know why..."
                />
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-ghost"
                >
                  Nevermind
                </button>
                <button
                  onClick={() => cancelMutation()}
                  disabled={cancelling}
                  className="btn btn-error"
                >
                  {cancelling ? "Cancelling..." : "Yes, Cancel Session"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RATE MODAL */}
        {showRateModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Rate Your Experience</h3>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Rating</span>
                </label>
                <div className="flex gap-2 justify-center my-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="btn btn-ghost btn-lg p-0"
                    >
                      <StarIcon
                        className={`size-10 ${
                          star <= rating ? "fill-warning text-warning" : "text-base-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Review (optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="textarea textarea-bordered h-24"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="modal-action">
                <button
                  onClick={() => setShowRateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rateMutation()}
                  disabled={isRating}
                  className="btn btn-primary"
                >
                  {isRating ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetailsPage;