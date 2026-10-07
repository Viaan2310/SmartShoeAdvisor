<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## UI architecture
- Keep the existing screen state machine and analysis modules unchanged during presentation work, so recommendation behavior remains stable.
- Use AdvisorButton as the shared shadcn-backed screen control and AdvisorHeader/AdvisorProgress for consistent navigation and flow state.
- Define visual roles in src/styles.css with semantic OKLCH tokens; UI modules must reference those roles rather than palette literals.
- Keep the exhibition sign-in layout in AuthScreen and reusable presentation styling in the global design system, so visual changes never alter authentication or recommendation behavior.
