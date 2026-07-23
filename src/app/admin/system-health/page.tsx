'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { SystemHealthMonitorView } from '../../../components/admin/SystemHealthMonitorView';

export default function SystemHealthStandalonePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SystemHealthMonitorView />
      </div>
    </DashboardLayout>
  );
}
