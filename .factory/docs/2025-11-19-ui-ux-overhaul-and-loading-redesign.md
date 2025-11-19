1. Remove Archon/CLAUDE references: delete or rewrite CLAUDE.md and any other docs referencing Archon; ensure instructions reflect current workflow.
2. Hook dashboards to real data: audit admin/captain/manager/sales dashboards, rankings, commission tabs; replace mock arrays with hooks/server actions; ensure tabs and quick actions invoke real logic.
3. Standardize loading UX: extract the green payroll spinner into a shared component and replace ad-hoc skeletons/white blocks across pages (logs, dashboards, forms, tables).
4. Fix functionality/UX gaps: ensure dashboard buttons/links work, remove “Coming Soon,” enlarge forms (no center-squish), improve customer-name field with inline typeahead suggestions.
5. Theme consistency: normalize brand colors/dark-mode tokens for analytics cards, commission pipeline/data freshness, checkboxes, multi-selects, hover states, and bulk operations.
6. Enhance interactions: replace aggressive tilt hover with smoother motion/animation that still feels lively.
7. Implement final QA: verify dark-mode UI, loaders, and animations across key pages; run lint/type-check; summarize changes, then commit/push under requested message.
