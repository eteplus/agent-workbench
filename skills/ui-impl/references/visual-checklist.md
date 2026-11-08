# Visual Checklist

Consult for high-fidelity implementation, difficult visual mismatches, or explicitly requested responsive/interaction states. Use only the dimensions relevant to the current reference.

## Visual Comparison

Compare under matching CSS viewport/DPR, route, theme, content, scroll position and framing. Account for fonts, images and asynchronous state before interpreting differences.

| Priority | Inspect |
|---|---|
| Layout | Page bounds; header/sidebar/content proportions; columns; major placement and whitespace |
| Geometry | Component width/height, padding, gaps, alignment, radius and repeated-item consistency |
| Typography | Font/fallback, size, weight, line-height, wrapping, truncation and baseline |
| Surfaces | Foreground/background, borders, shadows, gradients, overlays and theme contrast |
| Assets | Correct sources, crop/aspect ratio, object-fit, icon size/stroke/alignment and fine detail |

For each mismatch: visible difference → location → likely cause → smallest useful correction. Prioritize the largest impact before decorative detail. Use the existing design system rather than reproducing accidental pixels with arbitrary positioning.

Side-by-side comparison, overlays and pixel diffs can support diagnosis. Explain observed differences; image measurements are estimates unless confirmed by a design source or browser geometry.

## State Verification

When required by the task:

- Check every requested responsive breakpoint and important layout transition.
- Inspect overflow, clipping, wrapping and touch-target size; save desktop/mobile separately.
- Reproduce specified popover, dialog, hover, focus and other interaction states with real controls.
- Verify keyboard interaction and accessible names/semantics.
- Use deterministic authorized data setup, preserving comparable content density.
- Save important states separately and record their source, including controlled fixtures/responses.

A static screenshot establishes display, not subscription, persistence or model execution. Keep functional results and visual evidence separate in the report.
