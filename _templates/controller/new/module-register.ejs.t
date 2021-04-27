---
inject: true
to: src/index.ts
append: true
skip_if: register(<%= Name %>Controller)
---
register(<%= Name %>Controller);