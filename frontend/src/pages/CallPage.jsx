import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, getSessionById } from "../lib/api";
import { StreamVideo, StreamVideoClient, StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [warningShown, setWarningShown] = useState(false);
  const [gracePeriodWarningShown, setGracePeriodWarningShown] = useState(false);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const sessionId = channelId?.split("-")[0];

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSessionById(sessionId),
    enabled: !!sessionId,
  });


  useEffect(() => {
    if (!tokenData?.token || !authUser || !channelId) return;

    const initVideoClient = async () => {
      try {
        const client = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic || "",
          },
          token: tokenData.token,
        });

        const videoCall = client.call("default", channelId);
        await videoCall.join({ create: true });

        setVideoClient(client);
        setCall(videoCall);

        toast.success("Video call started! 📹");
      } catch (error) {
        console.error("Error initializing video call:", error);
        toast.error("Failed to start video call");
      }
    };

    initVideoClient();

    return () => {
      if (call) {
        call.leave().catch((err) => console.log("Error leaving call:", err));
      }
    };
  }, [tokenData?.token, authUser, channelId]);

  // Timer with Grace Period
  useEffect(() => {
    if (!session) return;

    const duration = session.duration; // in minutes (30, 60, 90, 120)
    const gracePeriod = 5; // 5 extra minutes
    const totalDuration = duration + gracePeriod;

    const scheduledTime = new Date(session.scheduledDate);
    const endTime = new Date(scheduledTime.getTime() + duration * 60 * 1000);
    const finalEndTime = new Date(scheduledTime.getTime() + totalDuration * 60 * 1000);

    // Update countdown every second
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, finalEndTime - now);
      setTimeLeft(remaining);

      // 5-minute warning (before scheduled end)
      if (remaining <= (duration - (duration - 5)) * 60 * 1000 + gracePeriod * 60 * 1000 && 
          remaining > (duration - (duration - 4.9)) * 60 * 1000 + gracePeriod * 60 * 1000 && 
          !warningShown) {
        toast.warning("⏰ 5 minutes remaining!");
        setWarningShown(true);
      }

      // Scheduled time ended, entering grace period
      if (now >= endTime && now < finalEndTime && !gracePeriodWarningShown) {
        toast.info("⏱️ Scheduled time ended. You have 5 more minutes (grace period).");
        setGracePeriodWarningShown(true);
      }

      // Grace period ended - Auto-end call
      if (remaining === 0) {
        toast.error("⏱️ Session time + grace period ended. Closing call...");
        setTimeout(async () => {
          if (call) {
            await call.leave();
          }
          navigate(`/sessions/${session._id}`);
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, call, navigate, warningShown, gracePeriodWarningShown]);

  // Format time remaining
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Determine timer color
  const getTimerColor = () => {
    if (!timeLeft || !session) return "badge-info";
    
    const duration = session.duration;
    const scheduledEndTime = new Date(session.scheduledDate).getTime() + duration * 60 * 1000;
    const now = new Date().getTime();
    
    // In grace period (red)
    if (now >= scheduledEndTime) return "badge-error animate-pulse";
    
    // Less than 5 minutes (warning - yellow)
    if (timeLeft < 5 * 60 * 1000) return "badge-warning";
    
    // Normal time (blue)
    return "badge-info";
  };

  if (!videoClient || !call) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Connecting to video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative bg-base-300">
      {/* Timer Display */}
      {timeLeft !== null && session && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`badge badge-lg gap-2 ${getTimerColor()} text-lg px-6 py-4 shadow-lg`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-bold">{formatTime(timeLeft)}</span>
            {new Date().getTime() >= new Date(session.scheduledDate).getTime() + session.duration * 60 * 1000 && (
              <span className="text-xs">(grace period)</span>
            )}
          </div>
        </div>
      )}

      {/* Video Call Interface */}
      <StreamVideo client={videoClient}>
        <StreamTheme>
          <StreamCall call={call}>
            <div className="h-full">
              {/* You can customize the video UI here */}
              {/* The StreamCall component provides default UI */}
            </div>
          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </div>
  );
};

export default CallPage;