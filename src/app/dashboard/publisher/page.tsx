'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { PublisherLayout } from '../../../components/publisher/PublisherLayout';

export default function SocialPublisherDashboardPage() {
  return (
    <DashboardLayout>
      <PublisherLayout />
    </DashboardLayout>
  );
}
