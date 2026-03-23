import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedUsers, unblockUser } from "../lib/api";
import toast from "react-hot-toast";
import { ShieldIcon, UserXIcon, LoaderIcon } from "lucide-react";
import PageLoader from "../components/PageLoader";

const SettingsPage = () => {
  const queryClient = useQueryClient();

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
  });

  const { mutate: unblockMutation, isPending } = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      toast.success("User unblocked successfully");
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="opacity-70">Manage your account preferences</p>
        </div>

        {/* BLOCKED USERS SECTION */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2 mb-4">
              <ShieldIcon className="size-6 text-error" />
              Blocked Users
            </h2>

            {blockedUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserXIcon className="size-16 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No blocked users</h3>
                <p className="opacity-70">
                  Users you block will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 bg-base-300 rounded-lg hover:bg-base-300/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="size-12 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.fullName}</h3>
                        <p className="text-sm opacity-70">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => unblockMutation(user._id)}
                      disabled={isPending}
                      className="btn btn-sm btn-outline btn-success"
                    >
                      {isPending ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        "Unblock"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="alert alert-info mt-6">
              <div>
                <p className="text-sm">
                  <strong>About blocking:</strong> Blocked users cannot see your profile, 
                  send you messages, friend requests, or book sessions with you. They won't be notified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;