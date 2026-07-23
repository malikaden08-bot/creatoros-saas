'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';

const AdminLayout = dynamic(
  () => import('../../../components/admin/AdminLayout').then((mod) => mod.AdminLayout),
  {
    loading: () => (
      <div className="py-20 text-center space-y-3 font-mono text-xs text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
        <div>Loading Admin Control Plane & Governance Dashboard...</div>
      </div>
    ),
    ssr: false
  }
);

export default function EnterpriseAdminDashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-slate-400 font-mono text-xs text-center">Loading Admin Panel...</div>}>
        <AdminLayout />
      </Suspense>
    </DashboardLayout>
  );
}
