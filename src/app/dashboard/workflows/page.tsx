'use client';

import React from 'react';
import { AuthProvider } from '../../../context/AuthContext';
import { WorkflowBuilderLayout } from '../../../components/workflows/WorkflowBuilderLayout';

export default function VisualWorkflowBuilderPage() {
  return (
    <AuthProvider>
      <WorkflowBuilderLayout />
    </AuthProvider>
  );
}
