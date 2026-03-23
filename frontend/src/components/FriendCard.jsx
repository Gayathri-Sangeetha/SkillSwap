import { Link } from "react-router";
import { StarIcon, MessageSquareIcon, AwardIcon } from "lucide-react";

const FriendCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-xl transition-all duration-300 border border-base-300">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-14 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-200">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{friend.fullName}</h3>
            
            {/* RATING & STATS */}
            <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
              {friend.rating?.count > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="size-3 fill-warning text-warning" />
                  <span>{friend.rating.average.toFixed(1)}</span>
                </div>
              )}
              {friend.sessionsHosted > 0 && (
                <div className="flex items-center gap-1">
                  <AwardIcon className="size-3" />
                  <span>{friend.sessionsHosted} sessions</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SKILLS */}
        <div className="space-y-2 mb-3">
          {/* Skills to Teach */}
          {friend.skillsToTeach && friend.skillsToTeach.length > 0 && (
            <div>
              <p className="text-xs font-semibold opacity-70 mb-1">Can teach:</p>
              <div className="flex flex-wrap gap-1">
                {friend.skillsToTeach.slice(0, 2).map((skill, idx) => (
                  <span key={idx} className="badge badge-success badge-sm">
                    {skill.skill}
                  </span>
                ))}
                {friend.skillsToTeach.length > 2 && (
                  <span className="badge badge-ghost badge-sm">
                    +{friend.skillsToTeach.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Skills to Learn */}
          {friend.skillsToLearn && friend.skillsToLearn.length > 0 && (
            <div>
              <p className="text-xs font-semibold opacity-70 mb-1">Learning:</p>
              <div className="flex flex-wrap gap-1">
                {friend.skillsToLearn.slice(0, 2).map((skill, idx) => (
                  <span key={idx} className="badge badge-info badge-sm">
                    {skill.skill}
                  </span>
                ))}
                {friend.skillsToLearn.length > 2 && (
                  <span className="badge badge-ghost badge-sm">
                    +{friend.skillsToLearn.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* FALLBACK - Old language system for backward compatibility */}
          {(!friend.skillsToTeach || friend.skillsToTeach.length === 0) &&
           (!friend.skillsToLearn || friend.skillsToLearn.length === 0) &&
           (friend.nativeLanguage || friend.learningLanguage) && (
            <div className="flex flex-wrap gap-1">
              {friend.nativeLanguage && (
                <span className="badge badge-secondary badge-sm">
                  Native: {friend.nativeLanguage}
                </span>
              )}
              {friend.learningLanguage && (
                <span className="badge badge-outline badge-sm">
                  Learning: {friend.learningLanguage}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <Link 
            to={`/user/${friend._id}`}
            className="btn btn-outline btn-sm flex-1"
          >
            View Profile
          </Link>
          <Link 
            to={`/chat/${friend._id}`} 
            className="btn btn-primary btn-sm flex-1"
          >
            <MessageSquareIcon className="size-4 mr-1" />
            Message
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;