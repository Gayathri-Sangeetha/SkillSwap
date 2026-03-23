import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { 
  LoaderIcon, 
  MapPinIcon, 
  PencilIcon,
  SaveIcon,
  XIcon,
  PlusIcon,
  GlobeIcon,
  BookOpenIcon,
  GraduationCapIcon,
  MailIcon,
  CalendarIcon
} from "lucide-react";
import { ALL_SKILLS, SKILL_LEVELS, COMMON_TIMEZONES } from "../constants";
import { axiosInstance } from "../lib/axios";

const MyProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.put("/users/profile", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully! ✅");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSave = () => {
    if (!formState.fullName.trim()) {
      return toast.error("Please enter your full name");
    }
    if (!formState.bio.trim()) {
      return toast.error("Please write a short bio");
    }

    updateProfileMutation(formState);
  };

  const handleCancel = () => {
    // Reset to original values
    setFormState({
      fullName: authUser?.fullName || "",
      bio: authUser?.bio || "",
      location: authUser?.location || "",
      timezone: authUser?.timezone || "UTC",
      profilePic: authUser?.profilePic || "",
      skillsToTeach: authUser?.skillsToTeach || [],
      skillsToLearn: authUser?.skillsToLearn || [],
    });
    setIsEditing(false);
  };

  // Add skill to teach
  const addTeachSkill = () => {
    if (!newTeachSkill.skill.trim()) {
      return toast.error("Please enter a skill");
    }
    
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

  // Remove skills
  const removeTeachSkill = (index) => {
    setFormState({
      ...formState,
      skillsToTeach: formState.skillsToTeach.filter((_, i) => i !== index),
    });
  };

  const removeLearnSkill = (index) => {
    setFormState({
      ...formState,
      skillsToLearn: formState.skillsToLearn.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState({ ...formState, profilePic: reader.result });
        toast.success("Profile picture selected! ✅");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              <PencilIcon className="size-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn btn-ghost" disabled={isPending}>
                <XIcon className="size-4 mr-2" />
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-success" disabled={isPending}>
                {isPending ? (
                  <>
                    <LoaderIcon className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* PROFILE CARD */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body p-6 sm:p-8">
            
            {/* PROFILE PIC */}
            <div className="flex flex-col items-center mb-6">
              <div className="avatar size-32 rounded-full ring-4 ring-primary ring-offset-4 ring-offset-base-200 mb-4">
                {formState.profilePic ? (
                  <img src={formState.profilePic} alt={formState.fullName} />
                ) : (
                  <div className="bg-base-300 flex items-center justify-center size-32 rounded-full">
                    <GraduationCapIcon className="size-12 opacity-40" />
                  </div>
                )}
              </div>

              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-input file-input-bordered file-input-primary file-input-sm"
                />
              )}
            </div>

            {/* BASIC INFO */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GlobeIcon className="size-5 text-primary" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FULL NAME */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formState.fullName}
                      onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                      className="input input-bordered"
                    />
                  ) : (
                    <p className="p-3 bg-base-300 rounded-lg">{authUser?.fullName}</p>
                  )}
                </div>

                {/* EMAIL (Read-only) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="p-3 bg-base-300 rounded-lg flex items-center gap-2">
                    <MailIcon className="size-4 opacity-70" />
                    <span>{authUser?.email}</span>
                  </div>
                </div>

                {/* LOCATION */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Location</span>
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 opacity-70" />
                      <input
                        type="text"
                        value={formState.location}
                        onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                        className="input input-bordered pl-10"
                        placeholder="City, Country"
                      />
                    </div>
                  ) : (
                    <p className="p-3 bg-base-300 rounded-lg">{authUser?.location || "Not specified"}</p>
                  )}
                </div>

                {/* TIMEZONE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Timezone</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={formState.timezone}
                      onChange={(e) => setFormState({ ...formState, timezone: e.target.value })}
                      className="select select-bordered"
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-3 bg-base-300 rounded-lg">
                      {COMMON_TIMEZONES.find(tz => tz.value === authUser?.timezone)?.label || authUser?.timezone}
                    </p>
                  )}
                </div>
              </div>

              {/* BIO */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Bio</span>
                </label>
                {isEditing ? (
                  <textarea
                    value={formState.bio}
                    onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                    className="textarea textarea-bordered h-24"
                  />
                ) : (
                  <p className="p-3 bg-base-300 rounded-lg">{authUser?.bio}</p>
                )}
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="stat bg-base-300 rounded-lg p-4 text-center">
                  <div className="stat-value text-primary text-2xl">{authUser?.rating?.count || 0}</div>
                  <div className="stat-title text-xs">Reviews</div>
                </div>
                <div className="stat bg-base-300 rounded-lg p-4 text-center">
                  <div className="stat-value text-success text-2xl">{authUser?.rating?.average?.toFixed(1) || "0.0"}</div>
                  <div className="stat-title text-xs">Rating</div>
                </div>
                <div className="stat bg-base-300 rounded-lg p-4 text-center">
                  <div className="stat-value text-info text-2xl">{authUser?.sessionsHosted || 0}</div>
                  <div className="stat-title text-xs">Hosted</div>
                </div>
                <div className="stat bg-base-300 rounded-lg p-4 text-center">
                  <div className="stat-value text-warning text-2xl">{authUser?.sessionsCompleted || 0}</div>
                  <div className="stat-title text-xs">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SKILLS SECTION */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* SKILLS TO TEACH */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-success">
                <GraduationCapIcon className="size-5" />
                Skills I Can Teach
              </h2>

              {isEditing && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    list="teach-skills-list"
                    value={newTeachSkill.skill}
                    onChange={(e) => setNewTeachSkill({ ...newTeachSkill, skill: e.target.value })}
                    className="input input-bordered input-sm flex-1"
                    placeholder="Add skill..."
                  />
                  <datalist id="teach-skills-list">
                    {ALL_SKILLS.map((skill) => (
                      <option key={skill} value={skill} />
                    ))}
                  </datalist>
                  <select
                    value={newTeachSkill.level}
                    onChange={(e) => setNewTeachSkill({ ...newTeachSkill, level: e.target.value })}
                    className="select select-bordered select-sm w-32"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={addTeachSkill} className="btn btn-success btn-sm">
                    <PlusIcon className="size-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {formState.skillsToTeach?.map((skill, index) => (
                  <div key={index} className="badge badge-success badge-lg gap-2 p-3">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="opacity-70">({skill.level})</span>
                    {isEditing && (
                      <button
                        onClick={() => removeTeachSkill(index)}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SKILLS TO LEARN */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-info">
                <BookOpenIcon className="size-5" />
                Skills I Want to Learn
              </h2>

              {isEditing && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    list="learn-skills-list"
                    value={newLearnSkill.skill}
                    onChange={(e) => setNewLearnSkill({ ...newLearnSkill, skill: e.target.value })}
                    className="input input-bordered input-sm flex-1"
                    placeholder="Add skill..."
                  />
                  <datalist id="learn-skills-list">
                    {ALL_SKILLS.map((skill) => (
                      <option key={skill} value={skill} />
                    ))}
                  </datalist>
                  <select
                    value={newLearnSkill.level}
                    onChange={(e) => setNewLearnSkill({ ...newLearnSkill, level: e.target.value })}
                    className="select select-bordered select-sm w-32"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={addLearnSkill} className="btn btn-info btn-sm">
                    <PlusIcon className="size-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {formState.skillsToLearn?.map((skill, index) => (
                  <div key={index} className="badge badge-info badge-lg gap-2 p-3">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="opacity-70">({skill.level})</span>
                    {isEditing && (
                      <button
                        onClick={() => removeLearnSkill(index)}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        <XIcon className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;