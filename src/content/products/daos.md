---
name: daos
tagline: Determinism you can measure, and prove.
accent: default
form: Library
order: 3
repo: https://github.com/sondalab-ai/daos
repoPublic: false
summary: The Deterministic Agent Output System, a Python system that makes an agent's output <strong>reproducible and verifiable</strong>. Results are cached and <strong>HMAC-signed</strong> so the same input yields the same answer, with the signing key as the trust root and a <strong>fail-closed runtime</strong> that refuses to run unsigned.
---

daos, the Deterministic Agent Output System, is the measurement bench for
answering whether an agent does the same thing twice, and proving it rather than
trusting it. Outputs are cached and cryptographically signed, so a repeated
input returns the identical answer and any tampering is detectable.

The signing key is the trust root of the whole guarantee: whoever can write the
cache decides every future answer, so the runtime refuses to start without
`DAOS_CACHE_HMAC_KEY` and there is no unsigned mode: fail-closed by design. It's
a local, single-user Python library (built and tested with `uv` + `pytest`: unit,
property, concurrency and structural suites), the execution-path implementation
of a written specification.

No UI, no terminal chrome: the quiet instrument the rest of the suite leans on
when a claim needs to be checked. The source repository is currently private.
