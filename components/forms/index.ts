/**
 * Form components barrel export
 * Optimized for tree-shaking and performance
 */

// Direct exports for components
export { FormFeedback, formFeedbackPresets, useFormFeedback } from './form-feedback';
export { SmartInput, commonValidationRules } from './smart-input';
export { InlineSuccessCheck } from './success-animation';

// Re-export types and utilities
export type { SmartInputProps, ValidationRule } from './smart-input';