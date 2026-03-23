import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMySessions } from "../lib/api";
import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  StarIcon
} from "lucide-react";
import PageLoader from "../components/PageLoader";

const SessionsPage = () => {
  const { authUser } = useAuthUser();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

 
  const queryParams = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (roleFilter !== "all") queryParams.role = roleFilter;

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", statusFilter, roleFilter],
    queryFn: () => getMySessions(queryParams),
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge-warning",
      confirmed: "badge-success",
      "in-progress": "badge-info",
      completed: "badge-neutral",
      cancelled: "badge-error",
    };
    return badges[status] || "badge-ghost";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="size-4" />;
      case "confirmed":
        return <CheckCircleIcon className="size-4" />;
      case "in-progress":
        return <PlayCircleIcon className="size-4" />;
      case "completed":
        return <CheckCircleIcon className="size-4" />;
      case "cancelled":
        return <XCircleIcon className="size-4" />;
      default:
        return null;
    }
  };

  // Check if session can be started
  const canStartSession = (session) => {
    if (session.status !== "confirmed") return false;
    
    const scheduledTime = new Date(session.scheduledDate);
    const now = new Date();
    const timeDiff = Math.abs(scheduledTime - now) / (1000 * 60); // minutes
    
    return timeDiff <= 10; // Can start within 10 minutes
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-6xl">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Sessions</h1>
            <p className="opacity-70">Manage your learning and teaching sessions</p>
          </div>
          <Link to="/" className="btn btn-primary">
            <CalendarIcon className="size-4 mr-2" />
            Find Teachers
          </Link>
        </div>

        {/* FILTERS */}
        <div className="card bg-base-200 shadow-lg mb-6">
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FilterIcon className="size-5" />
              <h2 className="font-semibold">Filters</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* STATUS FILTER */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* ROLE FILTER */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Role</span>
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="all">All Sessions</option>
                  <option value="teacher">Teaching</option>
                  <option value="learner">Learning</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SESSIONS LIST */}
        {sessions.length === 0 ? (
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body text-center py-12">
              <CalendarIcon className="size-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
              <p className="opacity-70 mb-4">
                {statusFilter === "all" && roleFilter === "all"
                  ? "You haven't scheduled any sessions yet"
                  : "No sessions match your current filters"}
              </p>
              <Link to="/" className="btn btn-primary">
                Find a Teacher
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              
              const isTeacher = session.teacher._id.toString() === authUser._id.toString();
              const otherUser = isTeacher ? session.learner : session.teacher;
              const myRole = isTeacher ? "teacher" : "learner";
              const actionLabel = isTeacher ? "Learning from you" : "Teaching you";

              return (
                <div
                  key={session._id}
                  className="card bg-base-200 hover:shadow-xl transition-all duration-300 border-2 border-base-300"
                >
                  <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      
                      {/* LEFT SIDE - USER INFO */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="avatar">
                          <div className="size-16 rounded-full">
                            <img src={otherUser.profilePic} alt={otherUser.fullName} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{otherUser.fullName}</h3>
                              <p className="text-sm opacity-70">
                                {actionLabel}: {session.skill}
                              </p>
                            </div>
                            <div className={`badge ${getStatusBadge(session.status)} gap-1`}>
                              {getStatusIcon(session.status)}
                              <span className="capitalize">{session.status}</span>
                            </div>
                          </div>

                          {/* SESSION DETAILS */}
                          <div className="flex flex-wrap gap-4 text-sm opacity-70 mt-3">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="size-4" />
                              <span>{formatDate(session.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="size-4" />
                              <span>{session.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserIcon className="size-4" />
                              <span className="capitalize">You are the {myRole}</span>
                            </div>
                          </div>

                          {/* NOTES */}
                          {session.notes && (
                            <div className="mt-3 p-3 bg-base-300 rounded-lg">
                              <p className="text-sm">
                                <span className="font-semibold">Notes: </span>
                                {session.notes}
                              </p>
                            </div>
                          )}

                          {/* RATING */}
                          {session.status === "completed" && session.rating && (
                            <div className="mt-3 flex items-center gap-2">
                              <StarIcon className="size-4 fill-warning text-warning" />
                              <span className="font-semibold">{session.rating}/5</span>
                              {session.review && (
                                <span className="text-sm opacity-70">- {session.review}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT SIDE - ACTIONS */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <Link
                          to={`/sessions/${session._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Details
                        </Link>

                        {/* CONDITIONAL ACTIONS */}
                        {session.status === "pending" && myRole === "teacher" && (
                          <Link
                            to={`/sessions/${session._id}`}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircleIcon className="size-4 mr-1" />
                            Confirm
                          </Link>
                        )}

                        {canStartSession(session) && (
                          <Link
                            to={`/sessions/${session._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <PlayCircleIcon className="size-4 mr-1" />
                            Start Session
                          </Link>
                        )}

                        {session.status === "completed" && !session.rating && myRole === "learner" && (
                          <Link
                            to={`/sessions/${session._id}`}
                            className="btn btn-warning btn-sm"
                          >
                            <StarIcon className="size-4 mr-1" />
                            Rate
                          </Link>
                        )}

                        {session.status === "confirmed" && (
                          <Link
                            to={`/chat/${otherUser._id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOWING COUNT */}
        {sessions.length > 0 && (
          <div className="text-center mt-6 opacity-70">
            Showing {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;