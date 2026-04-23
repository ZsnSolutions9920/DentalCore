"use client";

import { useState } from "react";
import { useModuleAccess } from "@/modules/core/hooks";
import { Settings, Save, User, Bell, Shield, Palette } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Checkbox,
} from "@/components/ui";

const tabs = [
  { label: "Profile", value: "profile", icon: User },
  { label: "Notifications", value: "notifications", icon: Bell },
  { label: "Security", value: "security", icon: Shield },
  { label: "Appearance", value: "appearance", icon: Palette },
];

export default function UserSettingsPage() {
  const access = useModuleAccess("MOD-ADMIN");
  const [activeTab, setActiveTab] = useState("profile");

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="USER-SETTINGS">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Settings</h1>
            <p className="text-sm text-stone-500 mt-0.5">Manage your personal preferences</p>
          </div>
        </div>
        <Button iconLeft={<Save className="w-4 h-4" />}>Save</Button>
      </div>

      {/* Pill Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
                activeTab === tab.value
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
          <Card padding="lg" className="max-w-2xl">
            <p className="font-semibold text-stone-700 mb-4">Personal Information</p>
            <div className="space-y-4">
              <Input label="Full Name" defaultValue="Dr. Sarah Mitchell" />
              <Input label="Email" defaultValue="admin@dentacore.com" type="email" />
              <Input label="Phone" defaultValue="(555) 201-0001" />
              <Input label="Title" defaultValue="Clinic Administrator" />
            </div>
          </Card>
          <Card padding="lg" className="max-w-2xl">
            <p className="font-semibold text-stone-700 mb-4">Work Details</p>
            <div className="space-y-4">
              <Input label="Branch" defaultValue="Main Clinic" disabled />
              <Input label="Role" defaultValue="Admin" disabled />
              <Input label="Employee ID" defaultValue="USR-001" disabled />
            </div>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <Card padding="lg" className="max-w-2xl animate-fade-in">
          <p className="font-semibold text-stone-700 mb-4">Notification Preferences</p>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-500">Email</p>
              <Checkbox checked={true} label="New appointment bookings" />
              <Checkbox checked={true} label="Cancellations and no-shows" />
              <Checkbox checked={false} label="Daily summary" />
              <Checkbox checked={true} label="Billing alerts" />
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-stone-500">In-App</p>
              <Checkbox checked={true} label="Desktop notifications" />
              <Checkbox checked={true} label="Sound alerts" />
              <Checkbox checked={false} label="Chat messages" />
            </div>
          </div>
        </Card>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <Card padding="lg" className="max-w-2xl animate-fade-in">
          <p className="font-semibold text-stone-700 mb-4">Security Settings</p>
          <div className="space-y-4">
            <Input label="Current Password" type="password" placeholder="Enter current password" />
            <Input label="New Password" type="password" placeholder="Enter new password" />
            <Input label="Confirm New Password" type="password" placeholder="Confirm new password" />
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <p className="text-sm font-medium text-stone-500">Two-Factor Authentication</p>
              <Checkbox checked={false} label="Enable 2FA via authenticator app" />
              <Checkbox checked={false} label="Enable 2FA via SMS" />
            </div>
          </div>
        </Card>
      )}

      {/* Appearance */}
      {activeTab === "appearance" && (
        <Card padding="lg" className="max-w-2xl animate-fade-in">
          <p className="font-semibold text-stone-700 mb-4">Appearance</p>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-3">Theme</p>
              <div className="flex gap-3">
                {[
                  { label: "Light", active: true, bg: "bg-white border-teal-500" },
                  { label: "Dark", active: false, bg: "bg-stone-800 border-stone-300" },
                  { label: "System", active: false, bg: "bg-gradient-to-r from-white to-stone-800 border-stone-300" },
                ].map((theme) => (
                  <button
                    key={theme.label}
                    className={`flex flex-col items-center gap-2 cursor-pointer`}
                  >
                    <div
                      className={`w-16 h-12 rounded-xl border-2 ${theme.bg} ${
                        theme.active ? "ring-2 ring-teal-500/20" : ""
                      }`}
                    />
                    <span className={`text-xs font-medium ${theme.active ? "text-teal-600" : "text-stone-500"}`}>
                      {theme.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <p className="text-sm font-medium text-stone-500">Display</p>
              <Checkbox checked={true} label="Compact sidebar" />
              <Checkbox checked={false} label="Show avatars in tables" />
              <Checkbox checked={true} label="Animate page transitions" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
