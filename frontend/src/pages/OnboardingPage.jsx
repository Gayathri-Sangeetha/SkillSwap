import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { 
  LoaderIcon, 
  MapPinIcon, 
  ShipWheelIcon, 
  ShuffleIcon,
  PlusIcon,
  XIcon,
  GlobeIcon,
  BookOpenIcon,
  GraduationCapIcon
} from "lucide-react";
import { ALL_SKILLS, SKILL_LEVELS, COMMON_TIMEZONES } from "../constants";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    timezone: authUser?.timezone || "UTC",
    profilePic: authUser?.profilePic || "",
    skillsToTeach: authUser?.skillsToTeach || [],
    skillsToLearn: authUser?.skillsToLearn || [],
  });

  // Temporary state for adding skills
  const [newTeachSkill, setNewTeachSkill] = useState({ skill: "", level: "intermediate" });
  const [newLearnSkill, setNewLearnSkill] = useState({ skill: "", level: "beginner" });

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      console.log("Onboarding success:", data); // Debug log
      toast.success("Profile completed successfully! 🎉");
      
      // Force immediate refetch
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.refetchQueries({ queryKey: ["authUser"] });
      
      // Manual refresh as fallback
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error) => {
      console.error("Onboarding error:", error); // Debug log
      toast.error(error.response?.data?.message || "Failed to complete onboarding");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formState.fullName.trim()) {
      return toast.error("Please enter your full name");
    }
    if (!formState.bio.trim()) {
      return toast.error("Please write a short bio");
    }
    if (formState.skillsToTeach.length === 0 && formState.skillsToLearn.length === 0) {
      return toast.error("Please add at least one skill to teach or learn");
    }

    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated! 🎨");
  };

  // Add skill to teach
  const addTeachSkill = () => {
    if (!newTeachSkill.skill.trim()) {
      return toast.error("Please enter a skill");
    }
    
    // Check for duplicates
    if (formState.skillsToTeach.some(s => s.skill.toLowerCase() === newTeachSkill.skill.toLowerCase())) {
      return toast.error("You already added this skill");
    }

    setFormState({
      ...formState,
      skillsToTeach: [...formState.skillsToTeach, { ...newTeachSkill }],
    });
    setNewTeachSkill({ skill: "", level: "intermediate" });
    toast.success("Skill added! 👍");
  };

  // Add skill to learn
  const addLearnSkill = () => {
    if (!newLearnSkill.skill.trim()) {
      return toast.error("Please enter a skill");
    }

    // Check for duplicates
    if (formState.skillsToLearn.some(s => s.skill.toLowerCase() === newLearnSkill.skill.toLowerCase())) {
      return toast.error("You already added this skill");
    }

    setFormState({
      ...formState,
      skillsToLearn: [...formState.skillsToLearn, { ...newLearnSkill }],
    });
    setNewLearnSkill({ skill: "", level: "beginner" });
    toast.success("Skill added! 📚");
  };

  // Remove skill from teach list
  const removeTeachSkill = (index) => {
    setFormState({
      ...formState,
      skillsToTeach: formState.skillsToTeach.filter((_, i) => i !== index),
    });
  };

  // Remove skill from learn list
  const removeLearnSkill = (index) => {
    setFormState({
      ...formState,
      skillsToLearn: formState.skillsToLearn.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-4xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          {/* HEADER */}
          <div className="text-center mb-8">
            <ShipWheelIcon className="size-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome to SkillSwap! 🎉</h1>
            <p className="text-base-content opacity-70">
              Let's set up your profile and start sharing skills
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* PROFILE PIC */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="size-32 rounded-full bg-base-300 overflow-hidden ring-4 ring-primary ring-offset-4 ring-offset-base-200">
                {formState.profilePic ? (
                  <img
                    src={formState.profilePic}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <GraduationCapIcon className="size-12 text-base-content opacity-40" />
                  </div>
                )}
              </div>

              <button type="button" onClick={handleRandomAvatar} className="btn btn-accent btn-sm">
                <ShuffleIcon className="size-4 mr-2" />
                Generate Random Avatar
              </button>
            </div>

            {/* BASIC INFO SECTION */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GlobeIcon className="size-5 text-primary" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FULL NAME */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* LOCATION */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Location</span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                    <input
                      type="text"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      className="input input-bordered w-full pl-10"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              {/* BIO */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bio *</span>
                </label>
                <textarea
                  value={formState.bio}
                  onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                  className="textarea textarea-bordered h-24"
                  placeholder="Tell others about yourself, your interests, and what you're passionate about..."
                  required
                />
              </div>

              {/* TIMEZONE */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Timezone</span>
                </label>
                <select
                  value={formState.timezone}
                  onChange={(e) => setFormState({ ...formState, timezone: e.target.value })}
                  className="select select-bordered w-full"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SKILLS TO TEACH SECTION */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCapIcon className="size-5 text-success" />
                Skills I Can Teach
              </h2>

              {/* Add Skill Form */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    list="teach-skills-list"
                    value={newTeachSkill.skill}
                    onChange={(e) => setNewTeachSkill({ ...newTeachSkill, skill: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="e.g., JavaScript, Guitar, Yoga..."
                  />
                  <datalist id="teach-skills-list">
                    {ALL_SKILLS.map((skill) => (
                      <option key={skill} value={skill} />
                    ))}
                  </datalist>
                </div>

                <select
                  value={newTeachSkill.level}
                  onChange={(e) => setNewTeachSkill({ ...newTeachSkill, level: e.target.value })}
                  className="select select-bordered w-40"
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <button type="button" onClick={addTeachSkill} className="btn btn-success">
                  <PlusIcon className="size-5" />
                </button>
              </div>

              {/* Skills List */}
              {formState.skillsToTeach.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formState.skillsToTeach.map((skill, index) => (
                    <div key={index} className="badge badge-success badge-lg gap-2 p-4">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="opacity-70">({skill.level})</span>
                      <button
                        type="button"
                        onClick={() => removeTeachSkill(index)}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SKILLS TO LEARN SECTION */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpenIcon className="size-5 text-info" />
                Skills I Want to Learn
              </h2>

              {/* Add Skill Form */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    list="learn-skills-list"
                    value={newLearnSkill.skill}
                    onChange={(e) => setNewLearnSkill({ ...newLearnSkill, skill: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="e.g., Python, Piano, Photography..."
                  />
                  <datalist id="learn-skills-list">
                    {ALL_SKILLS.map((skill) => (
                      <option key={skill} value={skill} />
                    ))}
                  </datalist>
                </div>

                <select
                  value={newLearnSkill.level}
                  onChange={(e) => setNewLearnSkill({ ...newLearnSkill, level: e.target.value })}
                  className="select select-bordered w-40"
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <button type="button" onClick={addLearnSkill} className="btn btn-info">
                  <PlusIcon className="size-5" />
                </button>
              </div>

              {/* Skills List */}
              {formState.skillsToLearn.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formState.skillsToLearn.map((skill, index) => (
                    <div key={index} className="badge badge-info badge-lg gap-2 p-4">
                      <span className="font-medium">{skill.skill}</span>
                      <span className="opacity-70">({skill.level})</span>
                      <button
                        type="button"
                        onClick={() => removeLearnSkill(index)}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button className="btn btn-primary w-full btn-lg" disabled={isPending} type="submit">
              {!isPending ? (
                <>
                  <ShipWheelIcon className="size-5 mr-2" />
                  Complete Profile & Get Started
                </>
              ) : (
                <>
                  <LoaderIcon className="animate-spin size-5 mr-2" />
                  Setting up your profile...
                </>
              )}
            </button>

            <p className="text-center text-sm opacity-70">
              * Required fields | You can update your profile anytime later
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;