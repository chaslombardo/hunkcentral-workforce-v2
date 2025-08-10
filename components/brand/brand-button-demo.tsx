"use client"

import { BrandButton } from "./brand-button"
import { User, Settings, Download, Plus, Trash2, Edit } from "lucide-react"

export function BrandButtonDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Button Variants</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton variant="primary">Primary</BrandButton>
          <BrandButton variant="secondary">Secondary</BrandButton>
          <BrandButton variant="success">Success</BrandButton>
          <BrandButton variant="warning">Warning</BrandButton>
          <BrandButton variant="destructive">Destructive</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Outline Variants</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton variant="outline-primary">Outline Primary</BrandButton>
          <BrandButton variant="outline-secondary">Outline Secondary</BrandButton>
          <BrandButton variant="outline">Outline</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Ghost Variants</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton variant="ghost-primary">Ghost Primary</BrandButton>
          <BrandButton variant="ghost-secondary">Ghost Secondary</BrandButton>
          <BrandButton variant="ghost">Ghost</BrandButton>
          <BrandButton variant="link">Link</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <BrandButton size="sm">Small</BrandButton>
          <BrandButton size="default">Default</BrandButton>
          <BrandButton size="lg">Large</BrandButton>
          <BrandButton size="icon" aria-label="Settings">
            <Settings />
          </BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton icon={User}>User Profile</BrandButton>
          <BrandButton variant="secondary" icon={Download}>Download</BrandButton>
          <BrandButton variant="outline-primary" icon={Plus}>Add Item</BrandButton>
          <BrandButton variant="ghost-secondary" icon={Edit}>Edit</BrandButton>
          <BrandButton variant="destructive" icon={Trash2}>Delete</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton loading>Loading Primary</BrandButton>
          <BrandButton variant="secondary" loading>Loading Secondary</BrandButton>
          <BrandButton variant="outline-primary" loading>Loading Outline</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Disabled States</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton disabled>Disabled Primary</BrandButton>
          <BrandButton variant="secondary" disabled>Disabled Secondary</BrandButton>
          <BrandButton variant="outline-primary" disabled>Disabled Outline</BrandButton>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">As Child (Link)</h3>
        <div className="flex flex-wrap gap-4">
          <BrandButton asChild>
            <a href="#demo">Link as Primary Button</a>
          </BrandButton>
          <BrandButton variant="secondary" asChild>
            <a href="#demo">Link as Secondary Button</a>
          </BrandButton>
        </div>
      </div>
    </div>
  )
}