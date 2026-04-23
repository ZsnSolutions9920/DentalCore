"use client";

import { useState } from "react";
import {
  Modal,
  Input,
  Select,
  Textarea,
  Button,
  Checkbox,
} from "@/components/ui";
import { useModuleEmit } from "@/modules/core/hooks";
import { SystemEvents } from "@/modules/core/events";
import { useCreateLead } from "@/hooks/use-queries";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewLeadModal({ isOpen, onClose }: NewLeadModalProps) {
  const emit = useModuleEmit("MOD-COMMUNICATION");
  const createLead = useCreateLead();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [interest, setInterest] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [quickBook, setQuickBook] = useState(false);

  const handleSaveLead = () => {
    createLead.mutate(
      { name, phone, email, source, interest, notes, callbackDate: callbackDate || undefined, status: "NEW" },
      {
        onSuccess: () => {
          emit(SystemEvents.LEAD_CREATED, { name, phone, source });
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Lead"
      size="lg"
      data-id="CALL-NEW-LEAD"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveLead}>Save Lead</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone" placeholder="(555) 000-0000" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Input label="Email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Source"
            required
            placeholder="Select source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={[
              { value: "CALL", label: "Phone Call" },
              { value: "WALK_IN", label: "Walk-in" },
              { value: "WEBSITE", label: "Website" },
              { value: "SOCIAL_MEDIA", label: "Social Media" },
              { value: "REFERRAL", label: "Referral" },
            ]}
          />
          <Select
            label="Interest"
            placeholder="Select interest area"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            options={[
              { value: "cleaning", label: "Scaling & Cleaning" },
              { value: "whitening", label: "Teeth Whitening" },
              { value: "filling", label: "Filling / Cavity" },
              { value: "rct", label: "Root Canal" },
              { value: "crown", label: "Crown / Bridge" },
              { value: "veneer", label: "Veneer" },
              { value: "implant", label: "Dental Implant" },
              { value: "aligners", label: "Braces / Clear Aligners" },
              { value: "extraction", label: "Extraction / Wisdom Tooth" },
              { value: "checkup", label: "Routine Checkup" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
        <Textarea label="Notes" placeholder="Any additional notes about the lead..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Input label="Callback Date" type="datetime-local" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)} />
        <div className="pt-2 border-t border-stone-200">
          <Checkbox
            checked={quickBook}
            onChange={setQuickBook}
            label="Quick Book - Create appointment immediately"
          />
        </div>
      </div>
    </Modal>
  );
}
