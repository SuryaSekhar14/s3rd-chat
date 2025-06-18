"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function UserAnalytics({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  // Track user identification
  useEffect(() => {
    if (isLoaded && user) {
      analytics.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        username: user.username,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      });

      // Track sign in
      analytics.track(ANALYTICS_EVENTS.USER_SIGNED_IN, {
        user_id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        sign_in_method: 'clerk',
      });
    }
  }, [user, isLoaded]);

  // Track page views
  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname]);

  // Track preview mode entry
  useEffect(() => {
    if (pathname === '/chat' && !user && isLoaded) {
      analytics.track(ANALYTICS_EVENTS.PREVIEW_MODE_ENTERED, {
        page_path: pathname,
      });
    }
  }, [pathname, user, isLoaded]);

  return <>{children}</>;
} 