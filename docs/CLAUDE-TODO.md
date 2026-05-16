# Out-of-scope follow-ups (captured, not built)

Spotted during scoped batch work. Do not fix inline in the batch that found it.

## From Batch 2 (v3 doc-detail + graph reskin, 2026-05-16)

- **doc-detail header action row overflows horizontally at mobile widths (<420px).** The PageHeader actions slot holds 5 controls (Graph, PDF, Report, Obligations, Export) which do not wrap on a 393px viewport. Consistent with the rest of v3 (BRIEF locks v3 to desktop 1280px+; shipped Batch 1 dashboard/obligations behave the same). Not a Batch 2 regression. Belongs to a future v3 responsive/mobile pass, not Batch 3 or 4 as currently scoped.
