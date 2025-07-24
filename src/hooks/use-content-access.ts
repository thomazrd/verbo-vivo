
"use client";

import { useState, useEffect } from 'react';

const CONTENT_LIMIT = 3;
const STORAGE_KEY = 'viewedStudyIds';

export function useContentAccess(studyId: string, isVisitor: boolean) {
  const [isLoading, setIsLoading] = useState(true);
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    // If not a visitor (i.e., user is logged in or check is disabled), grant access.
    if (!isVisitor) {
      setCanView(true);
      setIsLoading(false);
      return;
    }
    
    // If we've determined this is a visitor, run the check.
    setIsLoading(true);
    try {
      const viewedIdsString = localStorage.getItem(STORAGE_KEY);
      const viewedIds: string[] = viewedIdsString ? JSON.parse(viewedIdsString) : [];

      if (viewedIds.includes(studyId)) {
        // Already viewed this content, so access is granted
        setCanView(true);
      } else if (viewedIds.length < CONTENT_LIMIT) {
        // Limit not reached, grant access and update storage
        const newViewedIds = [...viewedIds, studyId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newViewedIds));
        setCanView(true);
      } else {
        // Limit reached and this is new content
        setCanView(false);
      }
    } catch (error) {
      // In case of any error (e.g., localStorage not available), grant access to avoid blocking user
      console.error("Error accessing localStorage for content access:", error);
      setCanView(true);
    } finally {
      setIsLoading(false);
    }
  }, [studyId, isVisitor]);

  return { canView, isLoading };
}
