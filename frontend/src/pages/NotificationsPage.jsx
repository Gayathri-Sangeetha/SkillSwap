import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, StarIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* INCOMING FRIEND REQUESTS */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-lg transition-shadow border border-base-300"
                    >
                      <div className="card-body p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {/* AVATAR */}
                            <div className="avatar w-16 h-16 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200 flex-shrink-0">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} />
                            </div>

                            {/* USER INFO */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg mb-1">{request.sender.fullName}</h3>
                              
                              {/* RATING */}
                              {request.sender.rating?.count > 0 && (
                                <div className="flex items-center gap-1 text-xs opacity-70 mb-2">
                                  <StarIcon className="size-3 fill-warning text-warning" />
                                  <span>{request.sender.rating.average.toFixed(1)} ({request.sender.rating.count} reviews)</span>
                                </div>
                              )}

                              {/* SKILLS */}
                              <div className="space-y-1.5">
                                {/* Skills to Teach */}
                                {request.sender.skillsToTeach && request.sender.skillsToTeach.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold opacity-70 mb-1">Can teach:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {request.sender.skillsToTeach.slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="badge badge-success badge-sm">
                                          {skill.skill}
                                        </span>
                                      ))}
                                      {request.sender.skillsToTeach.length > 3 && (
                                        <span className="badge badge-ghost badge-sm">
                                          +{request.sender.skillsToTeach.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Skills to Learn */}
                                {request.sender.skillsToLearn && request.sender.skillsToLearn.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold opacity-70 mb-1">Wants to learn:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {request.sender.skillsToLearn.slice(0, 3).map((skill, idx) => (
                                        <span key={idx} className="badge badge-info badge-sm">
                                          {skill.skill}
                                        </span>
                                      ))}
                                      {request.sender.skillsToLearn.length > 3 && (
                                        <span className="badge badge-ghost badge-sm">
                                          +{request.sender.skillsToLearn.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* FALLBACK - Old language system */}
                                {(!request.sender.skillsToTeach || request.sender.skillsToTeach.length === 0) &&
                                 (!request.sender.skillsToLearn || request.sender.skillsToLearn.length === 0) &&
                                 (request.sender.nativeLanguage || request.sender.learningLanguage) && (
                                  <div className="flex flex-wrap gap-1">
                                    {request.sender.nativeLanguage && (
                                      <span className="badge badge-secondary badge-sm">
                                        Native: {request.sender.nativeLanguage}
                                      </span>
                                    )}
                                    {request.sender.learningLanguage && (
                                      <span className="badge badge-outline badge-sm">
                                        Learning: {request.sender.learningLanguage}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* LOCATION */}
                              {request.sender.location && (
                                <p className="text-xs opacity-70 mt-2">📍 {request.sender.location}</p>
                              )}
                            </div>
                          </div>

                          {/* ACCEPT BUTTON */}
                          <button
                            className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Accept"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQUESTS NOTIFICATIONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success gap-1">
                            <MessageSquareIcon className="h-3 w-3" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NO NOTIFICATIONS */}
            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;