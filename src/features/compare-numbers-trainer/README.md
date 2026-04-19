# Compare Numbers Trainer

This feature module contains the compare-numbers mini app split into:

- `routes`: thin route/page integration.
- `components`: setup/play shells and presentational UI pieces.
- `hooks`: controller orchestration, timer, analytics, capabilities.
- `model`: typed state, reducer, selectors, defaults.
- `services`: analytics adapter and capability resolver.
- `slots`: extension points for login/upgrade prompts and capability gates.
- `lib`: pure formatting and setup sanitization helpers.

The goal is to keep behavior stable while making auth gating, analytics, and future persistence/API additions straightforward.
