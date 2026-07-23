'use client';

import React, { useState } from 'react';
import { AdminHeader } from './AdminHeader';
import { SystemHealthMonitorView } from './SystemHealthMonitorView';
import { UserRoleManagementView } from './UserRoleManagementView';
import { BillingPaymentsAdminView } from './BillingPaymentsAdminView';
import { ApiKeysFeatureFlagsView } from './ApiKeysFeatureFlagsView';
import { SupportModerationView } from './SupportModerationView';
import { AuditLogsInfraView } from './AuditLogsInfraView';
import { AIProviderSettingsView } from './AIProviderSettingsView';
import { AnnouncementsModal } from './AnnouncementsModal';
import { SegmentedTabs } from '../ui/NavigationUI';

export const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('system-health');
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  return (
    <div className="space-y-6">
      <AdminHeader onOpenAnnouncementModal={() => setIsAnnouncementOpen(true)} />

      <div className="flex items-center justify-between">
        <SegmentedTabs
          tabs={[
            { id: 'system-health', label: 'Live System & AI Health', badge: 'LIVE' },
            { id: 'ai-providers', label: 'AI Provider Settings', badge: 'AI' },
            { id: 'users', label: 'Users & Roles (RBAC)', badge: '4' },
            { id: 'billing', label: 'Billing & Payments' },
            { id: 'flags', label: 'API & Feature Flags', badge: '3' },
            { id: 'support', label: 'Support & Moderation', badge: '2' },
            { id: 'audit', label: 'Audit Trail & Infrastructure' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'system-health' && <SystemHealthMonitorView />}
      {activeTab === 'ai-providers' && <AIProviderSettingsView />}
      {activeTab === 'users' && <UserRoleManagementView />}
      {activeTab === 'billing' && <BillingPaymentsAdminView />}
      {activeTab === 'flags' && <ApiKeysFeatureFlagsView />}
      {activeTab === 'support' && <SupportModerationView />}
      {activeTab === 'audit' && <AuditLogsInfraView />}

      <AnnouncementsModal isOpen={isAnnouncementOpen} onClose={() => setIsAnnouncementOpen(false)} />
    </div>
  );
};
