import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestSession, getUserProfile } from "../lib/api";
import { 
  CalendarIcon, 
  ClockIcon, 
  BookOpenIcon,
  ArrowLeftIcon,
  SendIcon,
  LoaderIcon
} from "lucide-react";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const SessionRequestPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const teacherId = searchParams.get("teacher");
  const preSelectedSkill = searchParams.get("skill");

  const [formData, setFormData] = useState({
    teacherId: teacherId || "",
    skill: preSelectedSkill || "",
    scheduledDate: "",
    duration: 60,
    notes: "",
  });

  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ["userProfile", teacherId],
    queryFn: () => getUserProfile(teacherId),
    enabled: !!teacherId,
  });

  const { mutate: requestSessionMutation, isPending } = useMutation({
    mutationFn: requestSession,
    onSuccess: () => {
      toast.success("Session request sent! 🎉");
      queryClient.invalidateQueries({ queryKey: ["upcomingSessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to request session");
    },
  });

  useEffect(() => {
    if (teacherId) {
      setFormData(prev => ({ ...prev, teacherId }));
    }
    if (preSelectedSkill) {
      setFormData(prev => ({ ...prev, skill: preSelectedSkill }));
    }
  }, [teacherId, preSelectedSkill]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.skill) {
      return toast.error("Please select a skill");
    }
    if (!formData.scheduledDate) {
      return toast.error("Please select a date and time");
    }

    // Check if date is in the future
    const selectedDate = new Date(formData.scheduledDate);
    const now = new Date();
    if (selectedDate <= now) {
      return toast.error("Please select a future date and time");
    }

    requestSessionMutation(formData);
  };

  // Get minimum date (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (loadingTeacher) return <PageLoader />;

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Teacher Not Found</h2>
          <p className="opacity-70 mb-4">Unable to load teacher information</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-3xl">
        
        {/* BACK BUTTON */}
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mb-6">
          <ArrowLeftIcon className="size-4 mr-2" />
          Back
        </button>

        {/* PAGE HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Request a Learning Session</h1>
          <p className="opacity-70">Schedule a session with {teacher.fullName}</p>
        </div>

        {/* TEACHER CARD */}
        <div className="card bg-base-200 shadow-lg mb-8">
          <div className="card-body p-6">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="size-16 rounded-full">
                  <img src={teacher.profilePic} alt={teacher.fullName} />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{teacher.fullName}</h2>
                {teacher.rating?.count > 0 && (
                  <p className="text-sm opacity-70">
                    ⭐ {teacher.rating.average.toFixed(1)} ({teacher.rating.count} reviews) • 
                    {teacher.sessionsHosted > 0 && ` ${teacher.sessionsHosted} sessions hosted`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* REQUEST FORM */}
        <form onSubmit={handleSubmit} className="card bg-base-200 shadow-lg">
          <div className="card-body p-6 sm:p-8 space-y-6">

            {/* SKILL SELECTION */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <BookOpenIcon className="size-4" />
                  What do you want to learn? *
                </span>
              </label>
              <select
                value={formData.skill}
                onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select a skill</option>
                {teacher.skillsToTeach?.map((skill, idx) => (
                  <option key={idx} value={skill.skill}>
                    {skill.skill} ({skill.level} level)
                  </option>
                ))}
              </select>
            </div>

            {/* DATE & TIME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  When would you like to meet? *
                </span>
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={getMinDateTime()}
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Sessions must be scheduled at least 1 hour in advance
                </span>
              </label>
            </div>

            {/* DURATION */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold flex items-center gap-2">
                  <ClockIcon className="size-4" />
                  Session Duration
                </span>
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="select select-bordered w-full"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes (recommended)</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* NOTES */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Session Goals / Notes (Optional)
                </span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea textarea-bordered h-32"
                placeholder="What would you like to focus on in this session? Any specific topics or questions?"
              />
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Help your teacher prepare by sharing your goals
                </span>
              </label>
            </div>

            {/* TEACHER AVAILABILITY INFO */}
            {teacher.availability && teacher.availability.length > 0 && (
              <div className="alert alert-info">
                <div className="flex-col items-start w-full">
                  <p className="font-semibold mb-2">Teacher's Availability:</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.availability.map((slot, idx) => (
                      <span key={idx} className="badge badge-outline">
                        {slot.day}: {slot.startTime} - {slot.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="card-actions justify-end pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4 mr-2" />
                    Send Session Request
                  </>
                )}
              </button>
            </div>

            <div className="divider"></div>

            {/* INFO BOX */}
            <div className="bg-base-300 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-1 text-sm opacity-80">
                <li>✓ {teacher.fullName} will receive your session request</li>
                <li>✓ They can accept or suggest a different time</li>
                <li>✓ Once confirmed, you'll both receive a notification</li>
                <li>✓ A video call link will be available 10 minutes before the session</li>
                <li>✓ After the session, you can rate and review</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionRequestPage;