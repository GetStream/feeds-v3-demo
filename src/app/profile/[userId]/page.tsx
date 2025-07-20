"use client";

import { useUser } from "../../../hooks/useUser";
import { UserProfile } from "../../../components/userProfile";
import { Loading } from "../../../components/loading";
import { Error } from "../../../components/error";
import { use } from "react";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const { user: currentUser, loading, error } = useUser();

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (error) {
    return (
      <Error
        title="Error"
        message="Failed to load profile"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // For demo purposes, we'll use the userId as the userName
  // In a real app, you'd fetch the user details from your database
  const userName = userId.replace("user-", "User ");

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <UserProfile 
          userId={userId} 
          userName={userName}
        />
      </div>
    </div>
  );
} 