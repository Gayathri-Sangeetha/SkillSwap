import { useParams, Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getUserProfile, 
  sendFriendRequest, 
  getUserFriends,
  getOutgoingFriendReqs,
  blockUser
} from "../lib/api";
import { 
  MapPinIcon, 
  GlobeIcon, 
  StarIcon, 
  AwardIcon,
  CalendarIcon,
  UserPlusIcon,
  MessageSquareIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import PageLoader from "../components/PageLoader";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

const UserProfilePage = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  
  const [selectedSkill, setSelectedSkill] = useState("");
  const [isFriend, setIsFriend] = useState(false);
  const [hasRequestBeenSent, setHasRequestBeenSent] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: outgoingReqs = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending: sendingRequest } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send request");
    },
  });

  const { mutate: blockMutation, isPending: blocking } = useMutation({
    mutationFn: () => blockUser(userId),
    onSuccess: () => {
      toast.success("User blocked successfully");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to block user");
    },
  });

  // Check if user is already a friend
  useEffect(() => {
    if (friends.length > 0) {
      const isAlreadyFriend = friends.some(friend => friend._id === userId);
      setIsFriend(isAlreadyFriend);
    }
  }, [friends, userId]);

  // Check if request already sent
  useEffect(() => {
    if (outgoingReqs.length > 0) {
      const hasSent = outgoingReqs.some(req => req.recipient._id === userId);
      setHasRequestBeenSent(hasSent);
    }
  }, [outgoingReqs, userId]);

  const handleRequestSession = () => {
    if (!selectedSkill) {
      return toast.error("Please select a skill first");
    }
    navigate(`/sessions/request?teacher=${userId}&skill=${selectedSkill}`);
  };

  const handleBlockUser = () => {
    if (window.confirm(`Are you sure you want to block ${user.fullName}? They won't be able to see your profile or contact you.`)) {
      blockMutation();
    }
  };

  if (isLoading) return <PageLoader />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="opacity-70 mb-4">This user profile doesn't exist</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = authUser?._id === userId;

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl">
        
        {/* BACK BUTTON */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeftIcon className="size-4 mr-2" />
          Back
        </button>

        {/* PROFILE HEADER */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* AVATAR */}
              <div className="flex flex-col items-center md:items-start">
                <div className="avatar">
                  <div className="size-32 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-base-200">
                    <img src={user.profilePic} alt={user.fullName} />
                  </div>
                </div>

                {/* RATING */}
                {user.rating?.count > 0 && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center gap-2 mb-1">
                      <StarIcon className="size-5 fill-warning text-warning" />
                      <span className="text-2xl font-bold">{user.rating.average.toFixed(1)}</span>
                    </div>
                    <p className="text-sm opacity-70">{user.rating.count} reviews</p>
                  </div>
                )}
              </div>

              {/* USER INFO */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{user.fullName}</h1>
                  
                  <div className="flex flex-wrap gap-3 text-sm opacity-70">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="size-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    
                    {user.timezone && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="size-4" />
                        <span>{user.timezone}</span>
                      </div>
                    )}

                    {user.sessionsHosted > 0 && (
                      <div className="flex items-center gap-1">
                        <AwardIcon className="size-4" />
                        <span>{user.sessionsHosted} sessions hosted</span>
                      </div>
                    )}

                    {user.sessionsCompleted > 0 && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="size-4" />
                        <span>{user.sessionsCompleted} sessions completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BIO */}
                {user.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="opacity-80">{user.bio}</p>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {!isOwnProfile && (
                  <div className="flex flex-wrap gap-3 pt-4">
                    {isFriend ? (
                      <Link 
                        to={`/chat/${userId}`}
                        className="btn btn-primary"
                      >
                        <MessageSquareIcon className="size-4 mr-2" />
                        Send Message
                      </Link>
                    ) : hasRequestBeenSent ? (
                      <button className="btn btn-disabled">
                        <CheckCircleIcon className="size-4 mr-2" />
                        Request Sent
                      </button>
                    ) : (
                      <button 
                        onClick={() => sendRequestMutation(userId)}
                        disabled={sendingRequest}
                        className="btn btn-primary"
                      >
                        <UserPlusIcon className="size-4 mr-2" />
                        {sendingRequest ? "Sending..." : "Send Friend Request"}
                      </button>
                    )}

                    {/* ✅ NEW: BLOCK BUTTON */}
                    <button
                      onClick={handleBlockUser}
                      disabled={blocking}
                      className="btn btn-error btn-outline"
                    >
                      <ShieldIcon className="size-4 mr-2" />
                      {blocking ? "Blocking..." : "Block User"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SKILLS SECTION */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* SKILLS TO TEACH */}
          {user.skillsToTeach && user.skillsToTeach.length > 0 && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-success">
                  <GlobeIcon className="size-5" />
                  Can Teach
                </h2>
                
                <div className="space-y-3 mt-4">
                  {user.skillsToTeach.map((skill, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedSkill === skill.skill 
                          ? 'border-success bg-success/10' 
                          : 'border-base-300 hover:border-success/50'
                      }`}
                      onClick={() => setSelectedSkill(skill.skill)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{skill.skill}</p>
                          <p className="text-sm opacity-70 capitalize">{skill.level} level</p>
                        </div>
                        {!isOwnProfile && (
                          <input 
                            type="radio" 
                            name="skill" 
                            className="radio radio-success"
                            checked={selectedSkill === skill.skill}
                            onChange={() => setSelectedSkill(skill.skill)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!isOwnProfile && selectedSkill && (
                  <button 
                    onClick={handleRequestSession}
                    className="btn btn-success btn-block mt-4"
                  >
                    <CalendarIcon className="size-4 mr-2" />
                    Request Session for {selectedSkill}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SKILLS TO LEARN */}
          {user.skillsToLearn && user.skillsToLearn.length > 0 && (
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-info">
                  <GlobeIcon className="size-5" />
                  Wants to Learn
                </h2>
                
                <div className="space-y-2 mt-4">
                  {user.skillsToLearn.map((skill, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg border border-base-300"
                    >
                      <p className="font-semibold">{skill.skill}</p>
                      <p className="text-sm opacity-70 capitalize">{skill.level} level</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AVAILABILITY */}
        {user.availability && user.availability.length > 0 && (
          <div className="card bg-base-200 shadow-lg mt-6">
            <div className="card-body">
              <h2 className="card-title">
                <ClockIcon className="size-5" />
                Availability
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {user.availability.map((slot, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-base-300">
                    <p className="font-semibold capitalize">{slot.day}</p>
                    <p className="text-sm opacity-70">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfilePage;