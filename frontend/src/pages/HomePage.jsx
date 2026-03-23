import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  getUpcomingSessions,
} from "../lib/api";
import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { 
  CheckCircleIcon, 
  MapPinIcon, 
  UserPlusIcon, 
  UsersIcon,
  CalendarIcon,
  StarIcon,
  AwardIcon,
  ClockIcon
} from "lucide-react";

import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: upcomingSessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["upcomingSessions"],
    queryFn: getUpcomingSessions,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 0) return "Past";
    if (hours < 1) return "Less than 1 hour";
    if (hours < 24) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return `In ${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        
        {/* UPCOMING SESSIONS SECTION */}
        {upcomingSessions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <CalendarIcon className="size-8 text-primary" />
                Upcoming Sessions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSessions.slice(0, 3).map((session) => {
                // ✅ FIXED: Determine role correctly
                const isTeacher = session.teacher._id.toString() === authUser._id.toString();
                const otherUser = isTeacher ? session.learner : session.teacher;
                const actionLabel = isTeacher ? "Learning from you" : "Teaching you";
                
                return (
                  <Link 
                    key={session._id} 
                    to={`/sessions/${session._id}`}
                    className="card bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-lg transition-all duration-300 border-2 border-primary/20"
                  >
                    <div className="card-body p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="avatar size-12">
                          <img src={otherUser.profilePic} alt={otherUser.fullName} className="rounded-full" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{otherUser.fullName}</h3>
                          <p className="text-sm opacity-70">{actionLabel}: {session.skill}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <ClockIcon className="size-4" />
                        <span>{formatDate(session.scheduledDate)}</span>
                      </div>

                      <div className="badge badge-primary mt-2">
                        {session.status === "confirmed" ? "✓ Confirmed" : "⏳ Pending"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {upcomingSessions.length > 3 && (
              <div className="text-center mt-4">
                <Link to="/sessions" className="btn btn-outline btn-sm">
                  View All Sessions
                </Link>
              </div>
            )}
          </section>
        )}

        {/* YOUR FRIENDS SECTION */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Connections</h2>
            <Link to="/notifications" className="btn btn-outline btn-sm">
              <UsersIcon className="mr-2 size-4" />
              Friend Requests
            </Link>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {friends.map((friend) => (
                <FriendCard key={friend._id} friend={friend} />
              ))}
            </div>
          )}
        </section>

        {/* RECOMMENDED USERS SECTION */}
        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Discover Skill Partners
                </h2>
                <p className="opacity-70">
                  Connect with people who can teach you or learn from you
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="text-base-content opacity-70">
                Check back later for new skill partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-xl transition-all duration-300 border border-base-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      {/* USER HEADER */}
                      <div className="flex items-start gap-3">
                        <div className="avatar size-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{user.fullName}</h3>
                          
                          {/* LOCATION */}
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{user.location}</span>
                            </div>
                          )}

                          {/* RATING & SESSIONS */}
                          <div className="flex items-center gap-3 mt-2">
                            {user.rating?.count > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <StarIcon className="size-3 fill-warning text-warning" />
                                <span className="font-semibold">{user.rating.average.toFixed(1)}</span>
                                <span className="opacity-70">({user.rating.count})</span>
                              </div>
                            )}
                            
                            {user.sessionsHosted > 0 && (
                              <div className="flex items-center gap-1 text-xs opacity-70">
                                <AwardIcon className="size-3" />
                                <span>{user.sessionsHosted} sessions</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SKILLS */}
                      <div className="space-y-2">
                        {/* Skills to Teach */}
                        {user.skillsToTeach && user.skillsToTeach.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-70 mb-1">Can teach:</p>
                            <div className="flex flex-wrap gap-1">
                              {user.skillsToTeach.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="badge badge-success badge-sm">
                                  {skill.skill}
                                </span>
                              ))}
                              {user.skillsToTeach.length > 3 && (
                                <span className="badge badge-ghost badge-sm">
                                  +{user.skillsToTeach.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skills to Learn */}
                        {user.skillsToLearn && user.skillsToLearn.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-70 mb-1">Wants to learn:</p>
                            <div className="flex flex-wrap gap-1">
                              {user.skillsToLearn.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="badge badge-info badge-sm">
                                  {skill.skill}
                                </span>
                              ))}
                              {user.skillsToLearn.length > 3 && (
                                <span className="badge badge-ghost badge-sm">
                                  +{user.skillsToLearn.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BIO */}
                      {user.bio && (
                        <p className="text-sm opacity-70 line-clamp-2">{user.bio}</p>
                      )}

                      {/* ACTIONS */}
                      <div className="flex gap-2 pt-2">
                        <Link 
                          to={`/user/${user._id}`}
                          className="btn btn-outline btn-sm flex-1"
                        >
                          View Profile
                        </Link>
                        
                        <button
                          className={`btn btn-sm flex-1 ${
                            hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                          }`}
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={hasRequestBeenSent || isPending}
                        >
                          {hasRequestBeenSent ? (
                            <>
                              <CheckCircleIcon className="size-4" />
                              Sent
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4" />
                              Connect
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;