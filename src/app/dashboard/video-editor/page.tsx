'use client';

import React from 'react';
import { AuthProvider } from '../../../context/AuthContext';
import { VideoEditorLayout } from '../../../components/video-editor/VideoEditorLayout';

export default function ProfessionalVideoEditorPage() {
  return (
    <AuthProvider>
      <VideoEditorLayout />
    </AuthProvider>
  );
}
