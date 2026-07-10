"use client";

import { PropertyForm } from "@/components/dashboard/property-form";

export default function NewPropertyPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add property</h1>
      <PropertyForm />
    </div>
  );
}
