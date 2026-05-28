import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useParticipantAuthStore from '../stores/useParticipantAuthStore';

export default function ParticipantGuard({ children }) {
  const isAuthenticated = useParticipantAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
