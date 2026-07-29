"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuizReviewPage() {
  const params = useParams();
  const router = useRouter();
  
  // Redirect to the new results page
  useEffect(() => {
    router.replace(`/quiz/results/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
