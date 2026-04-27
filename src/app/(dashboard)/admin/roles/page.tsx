"use client";

import { useState } from "react";
import { useModuleAccess } from "@/modules/core/hooks";
import { Shield } from "lucide-react";
import {
  Card,
  Checkbox,
  Badge,
} from "@/components/ui";
import { Info } from "lucide-react";
import { UserRole } from "@/types";

const roles = [
  { value: UserRole.SUPER_ADMIN, label: "Super Admin" },
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.DOCTOR, label: "Doctor" },
  { value: UserRole.RECEPTIONIST, label: "Receptionist" },
  { value: UserRole.BILLING, label: "Billing" },
  { value: UserRole.CALL_CENTER, label: "Call Center" },
  { value: UserRole.ASSISTANT, label: "Assistant" },
];

const permissionGroups = [
  {
    group: "Patients",
    permissions: ["View Patients", "Create Patient", "Edit Patient", "Delete Patient"],
  },
  {
    group: "Appointments",
    permissions: ["View Appointments", "Create Appointment", "Edit Appointment", "Cancel Appointment"],
  },
  {
    group: "Billing",
    permissions: ["View Invoices", "Create Invoice", "Process Payment", "Issue Refund"],
  },
  {
    group: "Treatments",
    permissions: ["View Treatments", "Manage Treatments", "View Packages", "Manage Packages"],
  },
  {
    group: "Admin",
    permissions: ["Manage Staff", "Manage Branches", "Manage Roles", "View Audit Log"],
  },
  {
    group: "Reports",
    permissions: ["View Reports", "Export Data", "View Analytics", "Financial Reports"],
  },
];

// Default permission matrix
const defaultPermissions: Record<string, string[]> = {
  [UserRole.SUPER_ADMIN]: permissionGroups.flatMap((g) => g.permissions),
  [UserRole.ADMIN]: permissionGroups.flatMap((g) => g.permissions).filter((p) => p !== "Issue Refund"),
  [UserRole.DOCTOR]: [
    "View Patients", "Edit Patient", "View Appointments", "Create Appointment", "Edit Appointment",
    "View Invoices", "View Treatments", "View Packages", "View Reports", "View Analytics",
  ],
  [UserRole.RECEPTIONIST]: [
    "View Patients", "Create Patient", "Edit Patient", "View Appointments", "Create Appointment",
    "Edit Appointment", "Cancel Appointment", "View Invoices", "Create Invoice",
  ],
  [UserRole.BILLING]: [
    "View Patients", "View Appointments", "View Invoices", "Create Invoice", "Process Payment",
    "Issue Refund", "View Reports", "Financial Reports", "Export Data",
  ],
  [UserRole.CALL_CENTER]: [
    "View Patients", "Create Patient", "View Appointments", "Create Appointment",
  ],
  [UserRole.ASSISTANT]: [
    "View Patients", "View Appointments", "View Treatments",
  ],
};

export default function RolesPage() {
  const access = useModuleAccess("MOD-ADMIN");
  const [activeRole, setActiveRole] = useState<string>(UserRole.ADMIN);
  const [permissions, setPermissions] = useState<Record<string, string[]>>(defaultPermissions);

  if (!access.canView) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        You don&apos;t have access to this module.
      </div>
    );
  }

  const currentPerms = permissions[activeRole] || [];

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const rolePerms = prev[activeRole] || [];
      const next = rolePerms.includes(perm)
        ? rolePerms.filter((p) => p !== perm)
        : [...rolePerms, perm];
      return { ...prev, [activeRole]: next };
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-id="ADMIN-ROLES">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900">Roles & Permissions</h1>
            <p className="text-sm text-stone-500 mt-0.5">Control what each role can see and do</p>
          </div>
        </div>
      </div>

      {/* Info Banner — checkboxes are local-only; permissions enforced by module system at runtime */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-700">
          <span className="font-medium">Read-only preview.</span>{" "}
          Permission changes require server configuration. Roles are enforced by the module system at runtime.
        </div>
      </div>

      {/* Role Pill Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.value}
            onClick={() => setActiveRole(role.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              activeRole === role.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Permission Grid */}
      <div className="overflow-x-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {permissionGroups.map((group) => (
          <Card key={group.group} padding="lg" className="animate-fade-in">
            <p className="font-semibold text-stone-700 mb-4">{group.group}</p>
            <div className="space-y-3">
              {group.permissions.map((perm) => (
                <Checkbox
                  key={perm}
                  checked={currentPerms.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  label={perm}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}
