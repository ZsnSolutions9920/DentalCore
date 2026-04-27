"use client";

import { Activity, Calendar, Pill, Heart } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  usePatientAppointments,
  usePatientPrescriptions,
  usePatientTriage,
} from "@/hooks/use-queries";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Patient, Appointment, Prescription, Triage } from "@/types";

export function OverviewTab({ patient }: { patient: Patient }) {
  const { data: triageResponse, isLoading: triageLoading } = usePatientTriage(patient.id);
  const { data: apptResponse, isLoading: apptLoading } = usePatientAppointments(patient.id);
  const { data: rxResponse, isLoading: rxLoading } = usePatientPrescriptions(patient.id);

  if (triageLoading || apptLoading || rxLoading) return <LoadingSpinner />;

  const triageRecords = (triageResponse?.data || []) as Triage[];
  const triage = triageRecords[0] || null;
  const appointments = (apptResponse?.data || []) as Appointment[];
  const recentAppt = appointments.sort((a, b) => b.date.localeCompare(a.date))[0];
  const activeRx = (rxResponse?.data || []) as Prescription[];

  return (
    <div data-id="PATIENT-OVERVIEW-TAB" className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Last Vitals */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-stone-900">Last Vitals</h3>
            </div>
          </CardHeader>
          <CardContent>
            {triage ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Blood Pressure</span>
                  <span className="font-medium">{triage.systolicBP}/{triage.diastolicBP} mmHg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Heart Rate</span>
                  <span className="font-medium">{triage.heartRate} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Temperature</span>
                  <span className="font-medium">{triage.temperature}&deg;C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">BMI</span>
                  <span className="font-medium">{triage.bmi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">O2 Sat</span>
                  <span className="font-medium">{triage.oxygenSaturation}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500">No vitals recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointment */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-stone-900">Recent Appointment</h3>
            </div>
          </CardHeader>
          <CardContent>
            {recentAppt ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Date</span>
                  <span className="font-medium">{formatDate(recentAppt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Time</span>
                  <span className="font-medium">{recentAppt.startTime} - {recentAppt.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Doctor</span>
                  <span className="font-medium">{recentAppt.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Type</span>
                  <Badge variant="info">{recentAppt.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status</span>
                  <Badge variant={recentAppt.status === "COMPLETED" ? "success" : "warning"}>
                    {recentAppt.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500">No appointments found</p>
            )}
          </CardContent>
        </Card>

        {/* Active Prescriptions */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-stone-900">Active Prescriptions</h3>
            </div>
          </CardHeader>
          <CardContent>
            {activeRx.length > 0 ? (
              <div className="space-y-2">
                {activeRx[0].items.map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium">{item.medicineName}</p>
                    <p className="text-stone-500">{item.dosage} - {item.frequency}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">No active prescriptions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Balance */}
      {patient.outstandingBalance > 0 && (
        <Card padding="md" className="border-red-400 border-l-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Outstanding Balance</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(patient.outstandingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity — uses module store activities (not API-driven yet) */}
      <Card padding="md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-stone-900">Recent Activity</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">No recent activity for this patient</p>
        </CardContent>
      </Card>
    </div>
  );
}
