/**
 * The DAOS page's four languages (/daos/ only; the rest of the site is English).
 *
 * Ported from the standalone landing's DAOS_I18N dictionary. English is the
 * server-rendered text, so the page reads and indexes without JavaScript; the
 * page script swaps every `data-i18n` element's markup for the chosen language.
 * Values are trusted, authored HTML: inline only (`b`, `em`, `br`, and `span`
 * with a page or kit class), no `style=`, no script, and the same classes in
 * every language (scripts/daos-i18n.test.mjs).
 *
 * Every language is a `DaosDict`, so a key missing from IT/ES/DE, or one the
 * English text does not have, fails `astro check` rather than shipping a gap.
 */

export const DAOS_LANGS = ['en', 'it', 'es', 'de'] as const;
export type DaosLang = (typeof DAOS_LANGS)[number];

/** localStorage key for an explicit pick; absent means the browser decides. */
export const DAOS_LANG_KEY = 'daos-lang';

/** Native names for the switch's accessible labels. */
export const DAOS_LANG_NAMES: Record<DaosLang, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  de: 'Deutsch',
};

const en = {
  'hero.kicker':
    'Determinism as a runtime guarantee',
  'hero.h1':
    'Same input.<br>The <span class="id">byte-identical</span> output.<br>Every time.',
  'hero.lede':
    'An LLM gives you a different answer on every call. DAOS turns that call into a pure function — one input, context, and schema resolve <em>once</em> to a canonical output object, which is then pinned, signed, and replayed byte-for-byte: across time, and across every machine running the same designated variant and backend.',
  'proof.cap1':
    'Pinned mode',
  'proof.cap2':
    'the shipped product',
  'proof.resolve':
    'Resolve once',
  'proof.cost1':
    '1 inference',
  'proof.ticket':
    '“…charged $49.99 twice this month…”',
  'proof.step':
    'resolve · greedy → canonicalize → sign into cache',
  'proof.reproduce':
    'Reproduce that run',
  'proof.cost0':
    '0 inference',
  'proof.when':
    'a CI golden test · an auditor · a second machine',
  'proof.replay':
    '—&nbsp;the same bytes&nbsp;—',
  'proof.subnote':
    "You don't wait for the same ticket to arrive twice — you <b>reproduce the run you care about</b>, byte-for-byte, from its logged input. Determinism is a property of the <b>function</b>, not a bet on repeat traffic. Reproducing in a fresh process is <b>measured</b> (§&thinsp;04); a second machine holds <b>by design</b>, within one quantization and backend.",
  'proof.footK':
    'Measured',
  'proof.footV':
    '20 greedy runs → 1 output · replayed in a fresh process, 0 inference',
  'hero.fnComment':
    '// a pure function at the semantic tier — one designated variant, resolved once, replayed byte-for-byte',
  'nc.p':
    `<span class="sl-callout__title">This is not a cache</span>Memoizing a non-deterministic model is a <b>correctness bug</b>: it serves an answer the model would no longer give, and can't tell it's wrong. DAOS earns the right to cache <b>first</b> — the model hash and load config are folded into the key, so a model swap <b>invalidates</b> instead of serving stale, and a replay that doesn't match the signed log is flagged as a <b>detected bug</b>. The store is downstream of the guarantee, not the product.`,
  's01.kicker':
    'You already tried this',
  's01.h2':
    '<span class="k">temperature=0</span> is not determinism. It is a quieter kind of luck.',
  's01.tag1':
    'The config knob',
  's01.h3a':
    'Turning the sampler down',
  's01.p1':
    'Set <span class="mono">temperature=0</span>, <span class="mono">top_k=1</span>, <span class="mono">top_p</span> low, and the <em>selection rule</em> becomes deterministic: always take the argmax token. In our own runs it even held — 20 sequential greedy generations, four seeds, one under a competing thread on the same box: <b class="ink">one distinct output</b>.',
  's01.note1':
    'So on one variant, one backend, one machine, greedy can be byte-stable. That is where most teams stop — and where the guarantee they think they have does not exist.',
  's01.tag2':
    'Why it is not enough',
  's01.h3b':
    'Greedy removes one noise layer of six',
  's01.p2':
    'The argmax is deterministic, but the <em>scores it chooses over</em> are not stable across the axes that matter. Five layers survive <span class="mono">temperature=0</span> untouched:',
  's01.li1':
    'sampling entropy — the only layer a low temperature removes',
  's01.li2':
    'floating-point non-associativity in GPU kernel reductions',
  's01.li3':
    'continuous batching changing the numerics of your call',
  's01.li4':
    'quantization — a different bit-width computes a different function <span class="tie">— measured: Q4 split from FP16 on 9 of 40 fields (§04)</span>',
  's01.li5':
    'silent model drift on a hosted endpoint',
  's01.li6':
    'agent-level entropy — tool order, timestamps, retrieval',
  's01.punch':
    `<span class="mono">temperature=0</span> recomputes the answer and hopes it matches. On a low-margin token the argmax flips — and you get no signal that it did, and no way to prove today's answer equals yesterday's. <b>DAOS resolves once, canonicalizes the object, signs it into a content-addressable cache, and replays it — byte-for-byte, 0 inference.</b> Pinned mode <em>is</em> greedy decoding, plus the three things a knob cannot give you: a canonical form, a pinned entry, and a receipt.`,
  's02.h2':
    'Determinism moved off the token stream',
  's02.lead':
    'Some non-determinism cannot be removed — two quantizations of one model compute different functions and will never emit the same tokens. So DAOS does not fight for identical tokens. It moves the determinism contract onto a <b class="ink">canonicalized, schema-constrained output object</b>.',
  's02.note1':
    `The shipped product is <b class="ink">pinned mode</b>: one designated variant, one generation, canonicalized and validated against a bounded schema, with the variant's model hash and load config folded into the key. The result is frozen in a content-addressable, HMAC-signed cache and recorded in a signed, replayable event log.`,
  's02.note2':
    `Canonicalization is what makes the stored bytes well-defined: a raw generation of <span class="mono">confidence: 0.8500000119</span> is rendered <span class="mono ink-2">0.85</span> — number form is <b class="ink">schema-owned</b> (<span class="mono">multipleOf&nbsp;0.05</span>), overriding the serializer's shortest form — then NFC unicode, then JCS-sorted keys.`,
  's02.note3':
    'The guarantee is a fixed point you can build on — the same input resolves to the same output object, then every repeat is a signed replay, not a re-roll. Not “usually the same.” The same.',
  's03.kicker':
    'Neuroscience-informed design · spec v1.4 revision',
  'ui.designChoice':
    'Design choice',
  's03.h2':
    'The stochastic-substrate problem is old. Brains solved it first.',
  's03.lead':
    "A biological neural system holds one coherent thought on top of noisy, spiking, unreliable hardware. DAOS's resolution layer borrows three mechanisms that make that possible — and deliberately throws out the one that makes brains unreliable witnesses.",
  's03.from1':
    '<b>Attractor dynamics</b> <span class="arrow">→</span> pooled decoding',
  's03.h3a':
    'Settle the population, then read it',
  's03.p1':
    "A cortical population fed noisy input falls toward one of a few stable states, cleaning up the noise on the way down. DAOS's logit-pool strategy does the same: it averages the variants' probability <em>distributions</em> at each step and commits the pooled token to all of them in lockstep — resolving the ensemble into one discrete choice <em>before</em> collapsing to argmax, not after.",
  's03.c1':
    'R7.7 · aggregate probabilities, never raw logits · requires a shared tokenizer (cross-quant only) and in-process step-level access — excludes vLLM / LM Studio / TGI.',
  's03.from2':
    '<b>Population coding</b> <span class="arrow">→</span> the correlation ceiling',
  's03.h3b':
    'Averaging only scales under independent error',
  's03.p2':
    'Pooling N neurons suppresses noise as √N — but only when their errors are independent. Correlated noise imposes a hard ceiling. The same theorem bounds a quorum: quantization error is <em>systematic</em>, so stacking more bit-width variants plateaus fast. DAOS states this limit rather than hiding it — decorrelate with different quant <em>methods</em>, do not just add more.',
  's03.c2':
    'R7.8 · a limit surfaced, not a feature claimed · the same information-limiting correlation studied in population coding.',
  's03.from3':
    '<b>Predictive coding</b> <span class="arrow">→</span> a declared prior',
  's03.h3c':
    'Weight ambiguity toward a prior',
  's03.p3':
    'The brain stabilizes an ambiguous percept by weighting it toward a prior. DAOS breaks a tied vote the same way, with a schema-declared prior — and pointedly <em>rejected</em> the seductive “prior = most similar past answer,” because a similarity function smuggles non-determinism straight back in.',
  's03.c3':
    'R3.3(a) · permitted only as a pure, versioned function of logged state · token-ID backstop retained.',
  's03.from4':
    'The one we threw out: <b>confabulation</b>',
  's03.h3d':
    'The interpreter that invents coherence',
  's03.p4':
    "Split-brain work shows the mind fabricating a coherent story <em>after</em> the fact — and believing it. That post-hoc coherence is precisely DAOS's anti-goal: reproducible is not the same as trustworthy. The very mechanism that makes a brain feel certain is the one a determinism engine has to refuse.",
  's03.tagline':
    'Rejected in review · a machine that fabricates its own certainty is the failure mode, not the feature.',
  's03.foot':
    'Logit-pool (R7.7) is a spec-level resolution strategy for Track&nbsp;B research, not a switch a consumer flips today — the same honesty that governs the rest of this page.',
  's04.kicker':
    'Measured on real models, not just designed',
  's04.h2':
    'Llama-3.2 at three bit-widths, on an Apple M3 Pro.',
  's04.mlabel1':
    'The product · pinned mode',
  's04.lab1':
    'twenty sequential greedy generations of the pinned variant — one distinct output, stable under four seeds and a competing thread',
  's04.lab2':
    'inference calls to replay a logged run — reproduced byte-for-byte in a fresh process with a new signing key',
  's04.mlabel2':
    'The stress test <span class="sl-tag">Track&nbsp;B · research</span>',
  's04.lab3':
    'canonical object reconciled from three quantization variants of one model — a harder bar than single-variant determinism',
  's04.lab4':
    'Q4 lone-minority rate; FP16 was never the lone minority — dissent is monotone in precision',
  's04.capA':
    'Cross-quant resolution',
  's04.capB':
    '1 base model · 3 bit-widths',
  's04.leaf':
    'Voting the <b>priority</b> leaf',
  's04.lone':
    '← lone minority',
  's04.collapse':
    'field-wise majority',
  's04.subnote':
    "Q4's dissent is recorded and the field flagged <b>fragile</b>. The referee rule (highest precision wins) breaks only <em>no-majority</em> ties — here the 2–1 majority already decides.",
  's04.foot':
    'Of 40 resolved fields, 31 were unanimous and 9 split 2–1 across 6 of 10 tasks — where byte-identity was produced by resolution, not by three variants happening to agree. The quorum bought <em>determinism</em>, not accuracy: cross-quant makes no accuracy claim, and core no longer ships it as a product surface.',
  's05.h2':
    'Ten places it pays for itself',
  's05.h1':
    'Making LLM features testable at all',
  'ui.howItWorks':
    'How it works',
  's05.p1':
    'You cannot assert against a moving target, so teams stop writing the tests. With a fixed output, a golden test means something again: a prompt or model change becomes a diff you review, not noise you learn to ignore.',
  's05.h2c':
    'Audit and compliance in regulated domains',
  's05.p2':
    'Finance, insurance, healthcare: “why did it produce this, and can you reproduce it?” — sometimes years later, to a regulator. DAOS logs every resolution to a signed, append-only log and replays the exact run on demand. Tamper-evident by signature; reproducible by construction.',
  's05.h3':
    'Migrating quantization or backend',
  's05.p3':
    "Move to the cheaper Q4 model or a new inference server without a silent shift in behavior. Track B's cross-quant quorum resolved FP16, Q8 and Q4 to one canonical object — evidence that the semantic tier survives a bit-width change. It tells you a migration is <em>safe to test</em>, provable with a before/after replay; it is a research result, not a product switch. In practice: a platform team pins Q4 for cost, then re-runs last quarter's golden inputs to prove the switch changed nothing before rollout.",
  's05.h4':
    'Deterministic caching and k× cost control',
  's05.p4':
    'First resolution writes the answer once; every semantically identical request after it is a cache hit that skips inference. The cache key is the canonical form of the input, so <span class="mono">0.9</span> and <span class="mono">0.90</span> or reordered keys collapse to one entry. Determinism is what makes reuse <em>correct</em>.',
  's05.h5':
    'Stable contracts between pipeline stages',
  's05.p5':
    "In a multi-step agent, each stage consumes the last one's output; upstream noise cascades and failures stop reproducing. A schema-shaped contract at every boundary makes the whole pipeline reproducible and pins a failure to the stage that caused it. In practice: a nightly document pipeline re-runs extract → classify → route on the same inputs, so a regression is a reviewable diff at one stage, not a mystery that surfaced three stages later.",
  's05.h6':
    'Disagreement as a confidence signal',
  's05.p6':
    'When FP16, Q8 and Q4 split on a field, that field is fragile — low-margin, the kind that flips under batching or a model update. The quorum records the per-field vote and attributes each dissent to its variant, so contested fields route to review and unanimous ones run untouched. A research capability, not part of the pinned product. In practice: a claims extractor sends only the fields the three variants split on to a human, and auto-approves the unanimous ones.',
  's05.h7':
    'Structured extraction you can trust to a schema',
  's05.p7':
    'Invoices, contracts, document-to-JSON: output that conforms every time, the same document yielding the same row. Generation is grammar-constrained, validated, then repaired or <em>failed loudly</em> — never plausible-looking garbage passed downstream.',
  's05.h8':
    'A/B testing with a clean signal',
  's05.p8':
    "To know whether prompt v2 beats v1, you must remove output variance or you can't separate a real gain from sampling luck. DAOS strips it, so any change in output is attributable to the change you made — the experiment measures the thing you're testing. In practice: prompt v2 ships behind a flag and you re-run the same eval set — the output delta is the prompt, not the sampler.",
  's05.h9':
    'Reproducible research, benchmarks, evals',
  's05.p9':
    'Results are only credible when someone else re-runs your published eval on their own box. <b>Measured:</b> re-running the same triple in a fresh process with a new signing key returned the same bytes, 0 inference — the eval measures the model, not the noise floor. Extending that to a second machine is the <b>design scope</b>: byte-identity holds across boxes running one quantization and backend, never across a backend swap.',
  's05.h10':
    'Incident forensics on production behavior',
  's05.p10':
    "When a bad output ships, step one — reproducing it — is usually the hardest, because the conditions are gone. DAOS replays the exact run from its signed log with zero inference. And if the replay doesn't match, that divergence is itself flagged as a detected bug. In practice: a customer disputes an answer from three weeks ago; you replay the logged run and see the exact bytes they saw, not an approximation.",
  's06.h2':
    'Where DAOS is not the answer',
  's06.intro':
    'Honesty is part of the pitch — the discipline that produces the guarantee produces a clear boundary around it.',
  's06.h3a':
    '<span class="x">×</span> Open-ended or creative generation',
  's06.pa':
    'DAOS constrains output to a schema and rewards agreement. If you want variety, it is the wrong layer.',
  's06.h3b':
    '<span class="x">×</span> Correctness',
  's06.pb':
    'DAOS makes output <em>stable</em>, not <em>true</em>. A wrong answer pins as reliably as a right one — determinism is orthogonal to accuracy, and the product claims only the first.',
  's06.h3c':
    '<span class="x">×</span> Bitwise-identical tokens across quantizations',
  's06.pc':
    'Mathematically impossible — quantization changes the function computed. DAOS guarantees the semantic tier and says so, rather than claiming the impossible.',
  's06.h3d':
    '<span class="x">×</span> Cross-quant quorum in production',
  's06.pd':
    'It is Track B research with no accuracy claim; core raises <span class="mono">UnsupportedMode</span>. The shipped product is pinned mode — one designated variant.',
  's06.h3e':
    '<span class="x">×</span> Latency parity with a single call',
  's06.pe':
    'Resolution costs inference on the first call, then caches. You buy determinism with compute: a real cost cold, a lookup warm.',
  's06.h3f':
    '<span class="x">×</span> Detecting that a model drifted',
  's06.pf':
    "Replay proves the pipeline, not the model — it consumes yesterday's output, so a model that changed still replays green. That is drift detection: on the roadmap.",
  'close.kicker':
    'The takeaway',
  'close.h2':
    'If the variance is costing you, DAOS is the layer that removes it.',
  'close.lead':
    'Testability, auditability, cache correctness, a clean experiment — when “a different answer every time” is the problem, pinned mode hands you a pure function, with the receipts to prove it. Not a lower temperature. A fixed point.',
  'footer.guarantee':
    'Semantic-tier guarantee · SPEC v1.6',
};

export type DaosKey = keyof typeof en;
export type DaosDict = Record<DaosKey, string>;

const it: DaosDict = {
  'hero.kicker':
    'Il determinismo come garanzia a runtime',
  'hero.h1':
    `Stesso input.<br>L'output <span class="id">byte-identico</span>.<br>Ogni volta.`,
  'hero.lede':
    'Un LLM ti dà una risposta diversa a ogni chiamata. DAOS trasforma quella chiamata in una funzione pura: un input, un contesto e uno schema si risolvono <em>una volta</em> in un oggetto di output canonico, che viene poi fissato, firmato e riprodotto byte per byte — nel tempo, e su ogni macchina che esegue la stessa variante e lo stesso backend designati.',
  'proof.cap1':
    'Modalità pinned',
  'proof.cap2':
    'il prodotto rilasciato',
  'proof.resolve':
    'Risolvi una volta',
  'proof.cost1':
    '1 inferenza',
  'proof.ticket':
    '“…addebitati $49.99 due volte questo mese…”',
  'proof.step':
    'risolvi · greedy → canonicalizza → firma in cache',
  'proof.reproduce':
    "Riproduci quell'esecuzione",
  'proof.cost0':
    '0 inferenze',
  'proof.when':
    'un golden test in CI · un revisore · una seconda macchina',
  'proof.replay':
    '—&nbsp;gli stessi byte&nbsp;—',
  'proof.subnote':
    "Non aspetti che lo stesso ticket arrivi due volte — <b>riproduci l'esecuzione che ti interessa</b>, byte per byte, dal suo input registrato. Il determinismo è una proprietà della <b>funzione</b>, non una scommessa sul traffico ripetuto. Riprodurre in un processo nuovo è <b>misurato</b> (§&thinsp;04); una seconda macchina vale <b>per progetto</b>, entro una stessa quantizzazione e uno stesso backend.",
  'proof.footK':
    'Misurato',
  'proof.footV':
    '20 esecuzioni greedy → 1 output · riprodotto in un processo nuovo, 0 inferenze',
  'hero.fnComment':
    '// una funzione pura al livello semantico — una variante designata, risolta una volta, riprodotta byte per byte',
  'nc.p':
    `<span class="sl-callout__title">Questa non è una cache</span>Memoizzare un modello non deterministico è un <b>bug di correttezza</b>: restituisce una risposta che il modello non darebbe più, e non può accorgersi che è sbagliata. DAOS si guadagna il diritto di fare cache <b>prima</b> — l'hash del modello e la configurazione di caricamento entrano nella chiave, così un cambio di modello <b>invalida</b> invece di servire dati stantii, e un replay che non combacia col log firmato viene segnalato come <b>bug rilevato</b>. Lo store è a valle della garanzia, non è il prodotto.`,
  's01.kicker':
    "L'hai già provato",
  's01.h2':
    '<span class="k">temperature=0</span> non è determinismo. È una forma più silenziosa di fortuna.',
  's01.tag1':
    'La manopola di configurazione',
  's01.h3a':
    'Abbassare il sampler',
  's01.p1':
    'Imposta <span class="mono">temperature=0</span>, <span class="mono">top_k=1</span>, <span class="mono">top_p</span> basso, e la <em>regola di selezione</em> diventa deterministica: prendi sempre il token argmax. Nelle nostre prove ha persino tenuto — 20 generazioni greedy sequenziali, quattro seed, una sotto un thread concorrente sulla stessa macchina: <b class="ink">un unico output distinto</b>.',
  's01.note1':
    'Quindi su una variante, un backend, una macchina, greedy può essere byte-stabile. È lì che la maggior parte dei team si ferma — ed è lì che la garanzia che credono di avere non esiste.',
  's01.tag2':
    'Perché non basta',
  's01.h3b':
    'Greedy rimuove uno strato di rumore su sei',
  's01.p2':
    `L'argmax è deterministico, ma i <em>punteggi su cui sceglie</em> non sono stabili sugli assi che contano. Cinque strati sopravvivono a <span class="mono">temperature=0</span> intatti:`,
  's01.li1':
    "entropia di campionamento — l'unico strato che una temperatura bassa rimuove",
  's01.li2':
    'non-associatività in virgola mobile nelle riduzioni dei kernel GPU',
  's01.li3':
    'il continuous batching che cambia la numerica della tua chiamata',
  's01.li4':
    'quantizzazione — una diversa ampiezza di bit calcola una funzione diversa <span class="tie">— misurato: Q4 si è discostato da FP16 su 9 campi su 40 (§04)</span>',
  's01.li5':
    'drift silenzioso del modello su un endpoint gestito',
  's01.li6':
    'entropia a livello di agente — ordine dei tool, timestamp, retrieval',
  's01.punch':
    `<span class="mono">temperature=0</span> ricalcola la risposta e spera che coincida. Su un token a basso margine l'argmax si ribalta — e non ricevi alcun segnale che sia successo, né modo di dimostrare che la risposta di oggi è uguale a quella di ieri. <b>DAOS risolve una volta, canonicalizza l'oggetto, lo firma in una cache content-addressable e lo riproduce — byte per byte, 0 inferenze.</b> La modalità pinned <em>è</em> decoding greedy, più le tre cose che una manopola non può darti: una forma canonica, una voce fissata e una ricevuta.`,
  's02.h2':
    'Il determinismo spostato via dal flusso di token',
  's02.lead':
    'Parte del non-determinismo non si può rimuovere — due quantizzazioni di uno stesso modello calcolano funzioni diverse e non emetteranno mai gli stessi token. Perciò DAOS non combatte per token identici. Sposta il contratto di determinismo su un <b class="ink">oggetto di output canonicalizzato e vincolato allo schema</b>.',
  's02.note1':
    `Il prodotto rilasciato è la <b class="ink">modalità pinned</b>: una variante designata, una generazione, canonicalizzata e validata contro uno schema delimitato, con l'hash del modello della variante e la configurazione di caricamento fusi nella chiave. Il risultato viene congelato in una cache content-addressable firmata HMAC e registrato in un event log firmato e riproducibile.`,
  's02.note2':
    'La canonicalizzazione è ciò che rende ben definiti i byte memorizzati: una generazione grezza di <span class="mono">confidence: 0.8500000119</span> viene resa <span class="mono ink-2">0.85</span> — la forma numerica è <b class="ink">di proprietà dello schema</b> (<span class="mono">multipleOf&nbsp;0.05</span>), che prevale sulla forma più corta del serializzatore — poi unicode NFC, poi chiavi ordinate secondo JCS.',
  's02.note3':
    'La garanzia è un punto fisso su cui puoi costruire — lo stesso input si risolve nello stesso oggetto di output, poi ogni ripetizione è un replay firmato, non un nuovo tiro di dadi. Non “di solito uguale”. Uguale.',
  's03.kicker':
    'Design informato dalle neuroscienze · revisione spec v1.4',
  'ui.designChoice':
    'Scelta di progetto',
  's03.h2':
    "Il problema del substrato stocastico è antico. I cervelli l'hanno risolto per primi.",
  's03.lead':
    'Un sistema neurale biologico tiene un pensiero coerente sopra hardware rumoroso, a spike, inaffidabile. Il layer di risoluzione di DAOS prende in prestito tre meccanismi che lo rendono possibile — e scarta di proposito quello che rende i cervelli testimoni inaffidabili.',
  's03.from1':
    '<b>Dinamiche di attrattore</b> <span class="arrow">→</span> decoding aggregato',
  's03.h3a':
    'Fai assestare la popolazione, poi leggila',
  's03.p1':
    "Una popolazione corticale alimentata da input rumoroso cade verso uno di pochi stati stabili, ripulendo il rumore lungo la discesa. La strategia logit-pool di DAOS fa lo stesso: media le <em>distribuzioni</em> di probabilità delle varianti a ogni passo e assegna il token aggregato a tutte in lockstep — risolvendo l'ensemble in una scelta discreta <em>prima</em> di collassare all'argmax, non dopo.",
  's03.c1':
    'R7.7 · aggrega probabilità, mai logit grezzi · richiede un tokenizer condiviso (solo cross-quant) e accesso in-process a livello di passo — esclude vLLM / LM Studio / TGI.',
  's03.from2':
    '<b>Codifica di popolazione</b> <span class="arrow">→</span> il tetto della correlazione',
  's03.h3b':
    'La media scala solo con errori indipendenti',
  's03.p2':
    "Aggregare N neuroni sopprime il rumore come √N — ma solo quando i loro errori sono indipendenti. Il rumore correlato impone un tetto netto. Lo stesso teorema limita un quorum: l'errore di quantizzazione è <em>sistematico</em>, quindi impilare più varianti di ampiezza di bit raggiunge presto un plateau. DAOS dichiara questo limite invece di nasconderlo — decorrela con <em>metodi</em> di quantizzazione diversi, non aggiungerne solo di più.",
  's03.c2':
    "R7.8 · un limite reso esplicito, non una feature vantata · la stessa correlazione che limita l'informazione studiata nella codifica di popolazione.",
  's03.from3':
    '<b>Codifica predittiva</b> <span class="arrow">→</span> un prior dichiarato',
  's03.h3c':
    "Pesa l'ambiguità verso un prior",
  's03.p3':
    'Il cervello stabilizza un percetto ambiguo pesandolo verso un prior. DAOS spezza un voto in parità allo stesso modo, con un prior dichiarato dallo schema — e ha <em>rifiutato</em> con decisione il seducente “prior = risposta passata più simile”, perché una funzione di similarità reintroduce di soppiatto il non-determinismo.',
  's03.c3':
    'R3.3(a) · permesso solo come funzione pura e versionata dello stato registrato · backstop su token-ID mantenuto.',
  's03.from4':
    'Quella che abbiamo scartato: <b>confabulazione</b>',
  's03.h3d':
    "L'interprete che inventa coerenza",
  's03.p4':
    "Il lavoro sullo split-brain mostra la mente che fabbrica una storia coerente <em>dopo</em> il fatto — e ci crede. Quella coerenza post-hoc è esattamente l'anti-obiettivo di DAOS: riproducibile non è lo stesso che affidabile. Il meccanismo stesso che fa sentire certo un cervello è quello che un motore di determinismo deve rifiutare.",
  's03.tagline':
    'Respinto in review · una macchina che fabbrica la propria certezza è la modalità di fallimento, non la feature.',
  's03.foot':
    'Logit-pool (R7.7) è una strategia di risoluzione a livello di spec per la ricerca Track&nbsp;B, non un interruttore che un consumatore attiva oggi — la stessa onestà che governa il resto di questa pagina.',
  's04.kicker':
    'Misurato su modelli reali, non solo progettato',
  's04.h2':
    'Llama-3.2 a tre ampiezze di bit, su un Apple M3 Pro.',
  's04.mlabel1':
    'Il prodotto · modalità pinned',
  's04.lab1':
    'venti generazioni greedy sequenziali della variante pinned — un unico output distinto, stabile sotto quattro seed e un thread concorrente',
  's04.lab2':
    "chiamate di inferenza per riprodurre un'esecuzione registrata — riprodotta byte per byte in un processo nuovo con una nuova chiave di firma",
  's04.mlabel2':
    'Lo stress test <span class="sl-tag">Track&nbsp;B · research</span>',
  's04.lab3':
    "oggetto canonico riconciliato da tre varianti di quantizzazione di uno stesso modello — un'asticella più alta del determinismo a variante singola",
  's04.lab4':
    'tasso di minoranza solitaria di Q4; FP16 non è mai stato la minoranza solitaria — il dissenso è monotòno nella precisione',
  's04.capA':
    'Risoluzione cross-quant',
  's04.capB':
    '1 modello base · 3 ampiezze di bit',
  's04.leaf':
    'Votazione della foglia <b>priority</b>',
  's04.lone':
    '← minoranza solitaria',
  's04.collapse':
    'maggioranza campo per campo',
  's04.subnote':
    "Il dissenso di Q4 viene registrato e il campo segnalato <b>fragile</b>. La regola dell'arbitro (vince la precisione più alta) interviene solo nei pareggi <em>senza maggioranza</em> — qui la maggioranza 2–1 decide già.",
  's04.foot':
    "Su 40 campi risolti, 31 erano unanimi e 9 si sono divisi 2–1 su 6 dei 10 task — dove l'identità byte è stata prodotta dalla risoluzione, non da tre varianti che per caso concordano. Il quorum ha comprato <em>determinismo</em>, non accuratezza: cross-quant non fa alcuna affermazione di accuratezza, e il core non lo rilascia più come superficie di prodotto.",
  's05.h2':
    'Dieci punti in cui si ripaga',
  's05.h1':
    'Rendere le feature LLM testabili, punto',
  'ui.howItWorks':
    'Come funziona',
  's05.p1':
    'Non puoi fare asserzioni contro un bersaglio in movimento, così i team smettono di scrivere i test. Con un output fisso, un golden test torna a significare qualcosa: una modifica al prompt o al modello diventa un diff che revisioni, non rumore che impari a ignorare.',
  's05.h2c':
    'Audit e compliance in domini regolamentati',
  's05.p2':
    "Finanza, assicurazioni, sanità: “perché ha prodotto questo, e sai riprodurlo?” — a volte anni dopo, davanti a un regolatore. DAOS registra ogni risoluzione in un log firmato e append-only e riproduce l'esecuzione esatta su richiesta. A prova di manomissione per firma; riproducibile per costruzione.",
  's05.h3':
    'Migrare quantizzazione o backend',
  's05.p3':
    "Passa al modello Q4 più economico o a un nuovo server di inferenza senza uno spostamento silenzioso nel comportamento. Il quorum cross-quant di Track B ha risolto FP16, Q8 e Q4 in un unico oggetto canonico — prova che il livello semantico sopravvive a un cambio di ampiezza di bit. Ti dice che una migrazione è <em>sicura da testare</em>, dimostrabile con un replay prima/dopo; è un risultato di ricerca, non un interruttore di prodotto. In pratica: un platform team fissa Q4 per il costo, poi riesegue i golden input dell'ultimo trimestre per provare che il cambio non ha alterato nulla prima del rollout.",
  's05.h4':
    'Caching deterministico e controllo dei costi k×',
  's05.p4':
    `La prima risoluzione scrive la risposta una volta; ogni richiesta semanticamente identica dopo di essa è un cache hit che salta l'inferenza. La chiave di cache è la forma canonica dell'input, così <span class="mono">0.9</span> e <span class="mono">0.90</span> o chiavi riordinate collassano in un'unica voce. Il determinismo è ciò che rende il riuso <em>corretto</em>.`,
  's05.h5':
    'Contratti stabili tra gli stadi di una pipeline',
  's05.p5':
    "In un agente multi-step, ogni stadio consuma l'output del precedente; il rumore a monte si propaga a cascata e i fallimenti smettono di riprodursi. Un contratto a forma di schema a ogni confine rende l'intera pipeline riproducibile e inchioda un fallimento allo stadio che l'ha causato. In pratica: una pipeline documentale notturna riesegue extract → classify → route sugli stessi input, così una regressione è un diff revisionabile a un solo stadio, non un mistero emerso tre stadi dopo.",
  's05.h6':
    'Il disaccordo come segnale di confidenza',
  's05.p6':
    'Quando FP16, Q8 e Q4 si dividono su un campo, quel campo è fragile — a basso margine, il tipo che si ribalta sotto batching o un aggiornamento del modello. Il quorum registra il voto campo per campo e attribuisce ogni dissenso alla sua variante, così i campi contesi vanno in review e quelli unanimi passano intatti. Una capacità di ricerca, non parte del prodotto pinned. In pratica: un estrattore di sinistri manda a una persona solo i campi su cui le tre varianti si sono divise, e auto-approva quelli unanimi.',
  's05.h7':
    'Estrazione strutturata di cui ti puoi fidare a livello di schema',
  's05.p7':
    "Fatture, contratti, documento-verso-JSON: output conforme ogni volta, lo stesso documento che produce la stessa riga. La generazione è vincolata alla grammatica, validata, poi riparata oppure <em>fallisce ad alta voce</em> — mai spazzatura dall'aria plausibile passata a valle.",
  's05.h8':
    'A/B testing con un segnale pulito',
  's05.p8':
    "Per sapere se il prompt v2 batte v1, devi rimuovere la varianza dell'output o non puoi separare un guadagno reale dalla fortuna di campionamento. DAOS la elimina, così ogni variazione nell'output è attribuibile alla modifica che hai fatto — l'esperimento misura la cosa che stai testando. In pratica: il prompt v2 va in produzione dietro un flag e riesegui lo stesso set di eval — il delta di output è il prompt, non il sampler.",
  's05.h9':
    'Ricerca, benchmark ed eval riproducibili',
  's05.p9':
    "I risultati sono credibili solo quando qualcun altro riesegue la tua eval pubblicata sulla propria macchina. <b>Misurato:</b> rieseguire la stessa tripla in un processo nuovo con una nuova chiave di firma ha restituito gli stessi byte, 0 inferenze — l'eval misura il modello, non il pavimento di rumore. Estenderlo a una seconda macchina è lo <b>scope di progetto</b>: l'identità byte vale tra macchine che eseguono una stessa quantizzazione e uno stesso backend, mai attraverso un cambio di backend.",
  's05.h10':
    'Forense degli incidenti sul comportamento in produzione',
  's05.p10':
    "Quando esce un output sbagliato, il primo passo — riprodurlo — è di solito il più difficile, perché le condizioni sono sparite. DAOS riproduce l'esecuzione esatta dal suo log firmato con zero inferenze. E se il replay non combacia, quella divergenza è essa stessa segnalata come bug rilevato. In pratica: un cliente contesta una risposta di tre settimane fa; riproduci l'esecuzione registrata e vedi gli esatti byte che ha visto, non un'approssimazione.",
  's06.h2':
    'Dove DAOS non è la risposta',
  's06.intro':
    "L'onestà è parte della proposta — la disciplina che produce la garanzia produce un confine netto attorno ad essa.",
  's06.h3a':
    '<span class="x">×</span> Generazione aperta o creativa',
  's06.pa':
    "DAOS vincola l'output a uno schema e premia l'accordo. Se vuoi varietà, è il layer sbagliato.",
  's06.h3b':
    '<span class="x">×</span> Correttezza',
  's06.pb':
    "DAOS rende l'output <em>stabile</em>, non <em>vero</em>. Una risposta sbagliata si fissa in modo affidabile quanto una giusta — il determinismo è ortogonale all'accuratezza, e il prodotto rivendica solo il primo.",
  's06.h3c':
    '<span class="x">×</span> Token identici bit a bit tra quantizzazioni',
  's06.pc':
    "Matematicamente impossibile — la quantizzazione cambia la funzione calcolata. DAOS garantisce il livello semantico e lo dice, invece di rivendicare l'impossibile.",
  's06.h3d':
    '<span class="x">×</span> Quorum cross-quant in produzione',
  's06.pd':
    'È ricerca Track B senza alcuna affermazione di accuratezza; il core solleva <span class="mono">UnsupportedMode</span>. Il prodotto rilasciato è la modalità pinned — una variante designata.',
  's06.h3e':
    '<span class="x">×</span> Parità di latenza con una singola chiamata',
  's06.pe':
    'La risoluzione costa inferenza alla prima chiamata, poi va in cache. Compri il determinismo con il compute: un costo reale a freddo, una lookup a caldo.',
  's06.h3f':
    '<span class="x">×</span> Rilevare che un modello è andato in drift',
  's06.pf':
    "Il replay dimostra la pipeline, non il modello — consuma l'output di ieri, così un modello che è cambiato riproduce comunque verde. Quella è drift detection: sulla roadmap.",
  'close.kicker':
    'In sintesi',
  'close.h2':
    'Se la varianza ti sta costando, DAOS è il layer che la rimuove.',
  'close.lead':
    'Testabilità, auditabilità, correttezza della cache, un esperimento pulito — quando “una risposta diversa ogni volta” è il problema, la modalità pinned ti consegna una funzione pura, con le ricevute per provarlo. Non una temperatura più bassa. Un punto fisso.',
  'footer.guarantee':
    'Garanzia a livello semantico · SPEC v1.6',
};

const es: DaosDict = {
  'hero.kicker':
    'El determinismo como garantía en tiempo de ejecución',
  'hero.h1':
    'La misma entrada.<br>La salida <span class="id">idéntica byte a byte</span>.<br>Cada vez.',
  'hero.lede':
    'Un LLM te da una respuesta distinta en cada llamada. DAOS convierte esa llamada en una función pura: una entrada, un contexto y un esquema se resuelven <em>una vez</em> en un objeto de salida canónico, que luego se fija, se firma y se reproduce byte a byte — a lo largo del tiempo y en cada máquina que ejecuta la misma variante y el mismo backend designados.',
  'proof.cap1':
    'Modo pinned',
  'proof.cap2':
    'el producto lanzado',
  'proof.resolve':
    'Resuelve una vez',
  'proof.cost1':
    '1 inferencia',
  'proof.ticket':
    '“…cobrados $49.99 dos veces este mes…”',
  'proof.step':
    'resuelve · greedy → canonicaliza → firma en caché',
  'proof.reproduce':
    'Reproduce esa ejecución',
  'proof.cost0':
    '0 inferencias',
  'proof.when':
    'una prueba golden en CI · un auditor · una segunda máquina',
  'proof.replay':
    '—&nbsp;los mismos bytes&nbsp;—',
  'proof.subnote':
    'No esperas a que el mismo ticket llegue dos veces — <b>reproduces la ejecución que te importa</b>, byte a byte, desde su entrada registrada. El determinismo es una propiedad de la <b>función</b>, no una apuesta al tráfico repetido. Reproducir en un proceso nuevo está <b>medido</b> (§&thinsp;04); una segunda máquina se cumple <b>por diseño</b>, dentro de una misma cuantización y un mismo backend.',
  'proof.footK':
    'Medido',
  'proof.footV':
    '20 ejecuciones greedy → 1 salida · reproducido en un proceso nuevo, 0 inferencias',
  'hero.fnComment':
    '// una función pura en el nivel semántico — una variante designada, resuelta una vez, reproducida byte a byte',
  'nc.p':
    '<span class="sl-callout__title">Esto no es una caché</span>Memoizar un modelo no determinista es un <b>bug de corrección</b>: sirve una respuesta que el modelo ya no daría, y no puede saber que está mal. DAOS se gana el derecho a cachear <b>primero</b> — el hash del modelo y la configuración de carga entran en la clave, así un cambio de modelo <b>invalida</b> en lugar de servir datos obsoletos, y un replay que no coincide con el log firmado se marca como <b>bug detectado</b>. El almacén está aguas abajo de la garantía, no es el producto.',
  's01.kicker':
    'Ya lo intentaste',
  's01.h2':
    '<span class="k">temperature=0</span> no es determinismo. Es una forma más silenciosa de suerte.',
  's01.tag1':
    'La perilla de configuración',
  's01.h3a':
    'Bajar el sampler',
  's01.p1':
    'Pon <span class="mono">temperature=0</span>, <span class="mono">top_k=1</span>, <span class="mono">top_p</span> bajo, y la <em>regla de selección</em> se vuelve determinista: toma siempre el token argmax. En nuestras propias ejecuciones incluso se sostuvo — 20 generaciones greedy secuenciales, cuatro semillas, una bajo un hilo en competencia en la misma máquina: <b class="ink">una única salida distinta</b>.',
  's01.note1':
    'Así que en una variante, un backend, una máquina, greedy puede ser byte-estable. Ahí es donde la mayoría de los equipos se detiene — y donde la garantía que creen tener no existe.',
  's01.tag2':
    'Por qué no basta',
  's01.h3b':
    'Greedy quita una capa de ruido de seis',
  's01.p2':
    'El argmax es determinista, pero los <em>puntajes sobre los que elige</em> no son estables en los ejes que importan. Cinco capas sobreviven a <span class="mono">temperature=0</span> intactas:',
  's01.li1':
    'entropía de muestreo — la única capa que quita una temperatura baja',
  's01.li2':
    'no-asociatividad en punto flotante en las reducciones de kernels de GPU',
  's01.li3':
    'el continuous batching cambiando la numérica de tu llamada',
  's01.li4':
    'cuantización — un ancho de bits distinto calcula una función distinta <span class="tie">— medido: Q4 se separó de FP16 en 9 de 40 campos (§04)</span>',
  's01.li5':
    'deriva silenciosa del modelo en un endpoint alojado',
  's01.li6':
    'entropía a nivel de agente — orden de herramientas, timestamps, retrieval',
  's01.punch':
    '<span class="mono">temperature=0</span> recalcula la respuesta y espera que coincida. En un token de bajo margen el argmax se voltea — y no recibes ninguna señal de que ocurrió, ni forma de probar que la respuesta de hoy es igual a la de ayer. <b>DAOS resuelve una vez, canonicaliza el objeto, lo firma en una caché direccionable por contenido y lo reproduce — byte a byte, 0 inferencias.</b> El modo pinned <em>es</em> decodificación greedy, más las tres cosas que una perilla no puede darte: una forma canónica, una entrada fijada y un recibo.',
  's02.h2':
    'El determinismo movido fuera del flujo de tokens',
  's02.lead':
    'Parte del no-determinismo no se puede eliminar — dos cuantizaciones de un mismo modelo calculan funciones distintas y nunca emitirán los mismos tokens. Así que DAOS no pelea por tokens idénticos. Mueve el contrato de determinismo a un <b class="ink">objeto de salida canonicalizado y restringido por esquema</b>.',
  's02.note1':
    'El producto lanzado es el <b class="ink">modo pinned</b>: una variante designada, una generación, canonicalizada y validada contra un esquema acotado, con el hash del modelo de la variante y la configuración de carga fundidos en la clave. El resultado se congela en una caché direccionable por contenido y firmada con HMAC, y se registra en un event log firmado y reproducible.',
  's02.note2':
    'La canonicalización es lo que hace que los bytes almacenados estén bien definidos: una generación cruda de <span class="mono">confidence: 0.8500000119</span> se representa como <span class="mono ink-2">0.85</span> — la forma numérica es <b class="ink">propiedad del esquema</b> (<span class="mono">multipleOf&nbsp;0.05</span>), que prevalece sobre la forma más corta del serializador — luego unicode NFC, luego claves ordenadas según JCS.',
  's02.note3':
    'La garantía es un punto fijo sobre el que puedes construir — la misma entrada se resuelve al mismo objeto de salida, y cada repetición es un replay firmado, no una nueva tirada. No “casi siempre igual”. Igual.',
  's03.kicker':
    'Diseño informado por la neurociencia · revisión spec v1.4',
  'ui.designChoice':
    'Decisión de diseño',
  's03.h2':
    'El problema del sustrato estocástico es viejo. Los cerebros lo resolvieron primero.',
  's03.lead':
    'Un sistema neuronal biológico sostiene un pensamiento coherente sobre hardware ruidoso, con spikes, poco fiable. La capa de resolución de DAOS toma prestados tres mecanismos que lo hacen posible — y descarta a propósito el que vuelve a los cerebros testigos poco fiables.',
  's03.from1':
    '<b>Dinámica de atractores</b> <span class="arrow">→</span> decodificación agrupada',
  's03.h3a':
    'Deja asentar la población, luego léela',
  's03.p1':
    'Una población cortical alimentada con entrada ruidosa cae hacia uno de unos pocos estados estables, limpiando el ruido en la bajada. La estrategia logit-pool de DAOS hace lo mismo: promedia las <em>distribuciones</em> de probabilidad de las variantes en cada paso y asigna el token agrupado a todas al unísono — resolviendo el ensemble en una elección discreta <em>antes</em> de colapsar al argmax, no después.',
  's03.c1':
    'R7.7 · agrega probabilidades, nunca logits crudos · requiere un tokenizer compartido (solo cross-quant) y acceso in-process a nivel de paso — excluye vLLM / LM Studio / TGI.',
  's03.from2':
    '<b>Codificación de población</b> <span class="arrow">→</span> el techo de la correlación',
  's03.h3b':
    'El promedio solo escala con error independiente',
  's03.p2':
    'Agrupar N neuronas suprime el ruido como √N — pero solo cuando sus errores son independientes. El ruido correlacionado impone un techo duro. El mismo teorema acota un quórum: el error de cuantización es <em>sistemático</em>, así que apilar más variantes de ancho de bits llega pronto a una meseta. DAOS declara este límite en lugar de ocultarlo — decorrela con <em>métodos</em> de cuantización distintos, no solo añadas más.',
  's03.c2':
    'R7.8 · un límite expuesto, no una función reclamada · la misma correlación limitante de información estudiada en la codificación de población.',
  's03.from3':
    '<b>Codificación predictiva</b> <span class="arrow">→</span> un prior declarado',
  's03.h3c':
    'Pondera la ambigüedad hacia un prior',
  's03.p3':
    'El cerebro estabiliza un percepto ambiguo ponderándolo hacia un prior. DAOS rompe un empate del mismo modo, con un prior declarado por el esquema — y <em>rechazó</em> deliberadamente el seductor “prior = respuesta pasada más similar”, porque una función de similitud vuelve a colar el no-determinismo.',
  's03.c3':
    'R3.3(a) · permitido solo como función pura y versionada del estado registrado · se mantiene el respaldo por token-ID.',
  's03.from4':
    'La que descartamos: <b>confabulación</b>',
  's03.h3d':
    'El intérprete que inventa coherencia',
  's03.p4':
    'El trabajo con cerebro dividido muestra a la mente fabricando una historia coherente <em>después</em> del hecho — y creyéndosela. Esa coherencia post-hoc es justamente el anti-objetivo de DAOS: reproducible no es lo mismo que fiable. El mismo mecanismo que hace que un cerebro se sienta seguro es el que un motor de determinismo tiene que rechazar.',
  's03.tagline':
    'Rechazado en revisión · una máquina que fabrica su propia certeza es el modo de fallo, no la función.',
  's03.foot':
    'Logit-pool (R7.7) es una estrategia de resolución a nivel de spec para la investigación de Track&nbsp;B, no un interruptor que un consumidor activa hoy — la misma honestidad que gobierna el resto de esta página.',
  's04.kicker':
    'Medido en modelos reales, no solo diseñado',
  's04.h2':
    'Llama-3.2 en tres anchos de bits, en un Apple M3 Pro.',
  's04.mlabel1':
    'El producto · modo pinned',
  's04.lab1':
    'veinte generaciones greedy secuenciales de la variante pinned — una única salida distinta, estable bajo cuatro semillas y un hilo en competencia',
  's04.lab2':
    'llamadas de inferencia para reproducir una ejecución registrada — reproducida byte a byte en un proceso nuevo con una nueva clave de firma',
  's04.mlabel2':
    'La prueba de estrés <span class="sl-tag">Track&nbsp;B · research</span>',
  's04.lab3':
    'objeto canónico reconciliado a partir de tres variantes de cuantización de un mismo modelo — un listón más alto que el determinismo de variante única',
  's04.lab4':
    'tasa de minoría solitaria de Q4; FP16 nunca fue la minoría solitaria — el disenso es monótono en la precisión',
  's04.capA':
    'Resolución cross-quant',
  's04.capB':
    '1 modelo base · 3 anchos de bits',
  's04.leaf':
    'Votando la hoja <b>priority</b>',
  's04.lone':
    '← minoría solitaria',
  's04.collapse':
    'mayoría campo por campo',
  's04.subnote':
    'El disenso de Q4 se registra y el campo se marca <b>frágil</b>. La regla del árbitro (gana la mayor precisión) solo interviene en empates <em>sin mayoría</em> — aquí la mayoría 2–1 ya decide.',
  's04.foot':
    'De 40 campos resueltos, 31 fueron unánimes y 9 se dividieron 2–1 en 6 de las 10 tareas — donde la identidad byte fue producida por la resolución, no por tres variantes que por casualidad coinciden. El quórum compró <em>determinismo</em>, no exactitud: cross-quant no hace ninguna afirmación de exactitud, y el core ya no lo lanza como superficie de producto.',
  's05.h2':
    'Diez lugares donde se paga solo',
  's05.h1':
    'Hacer testeables las features de LLM, punto',
  'ui.howItWorks':
    'Cómo funciona',
  's05.p1':
    'No puedes aseverar contra un blanco en movimiento, así que los equipos dejan de escribir los tests. Con una salida fija, un golden test vuelve a significar algo: un cambio de prompt o de modelo se convierte en un diff que revisas, no en ruido que aprendes a ignorar.',
  's05.h2c':
    'Auditoría y cumplimiento en dominios regulados',
  's05.p2':
    'Finanzas, seguros, salud: “¿por qué produjo esto, y puedes reproducirlo?” — a veces años después, ante un regulador. DAOS registra cada resolución en un log firmado y de solo anexado, y reproduce la ejecución exacta a demanda. A prueba de manipulación por firma; reproducible por construcción.',
  's05.h3':
    'Migrar cuantización o backend',
  's05.p3':
    'Pasa al modelo Q4 más barato o a un nuevo servidor de inferencia sin un cambio silencioso en el comportamiento. El quórum cross-quant de Track B resolvió FP16, Q8 y Q4 a un único objeto canónico — evidencia de que el nivel semántico sobrevive a un cambio de ancho de bits. Te dice que una migración es <em>segura de probar</em>, demostrable con un replay antes/después; es un resultado de investigación, no un cambio de producto. En la práctica: un equipo de plataforma fija Q4 por coste, luego reejecuta los golden inputs del trimestre pasado para probar que el cambio no alteró nada antes del despliegue.',
  's05.h4':
    'Caché determinista y control de coste k×',
  's05.p4':
    'La primera resolución escribe la respuesta una vez; cada solicitud semánticamente idéntica después de ella es un cache hit que salta la inferencia. La clave de caché es la forma canónica de la entrada, así <span class="mono">0.9</span> y <span class="mono">0.90</span> o claves reordenadas colapsan a una sola entrada. El determinismo es lo que hace que la reutilización sea <em>correcta</em>.',
  's05.h5':
    'Contratos estables entre las etapas de una pipeline',
  's05.p5':
    'En un agente multi-paso, cada etapa consume la salida de la anterior; el ruido aguas arriba se propaga en cascada y los fallos dejan de reproducirse. Un contrato con forma de esquema en cada frontera hace toda la pipeline reproducible y fija un fallo a la etapa que lo causó. En la práctica: una pipeline documental nocturna reejecuta extract → classify → route sobre las mismas entradas, así que una regresión es un diff revisable en una etapa, no un misterio que surgió tres etapas después.',
  's05.h6':
    'El desacuerdo como señal de confianza',
  's05.p6':
    'Cuando FP16, Q8 y Q4 se dividen en un campo, ese campo es frágil — de bajo margen, del tipo que se voltea bajo batching o una actualización de modelo. El quórum registra el voto campo por campo y atribuye cada disenso a su variante, así los campos en disputa van a revisión y los unánimes pasan intactos. Una capacidad de investigación, no parte del producto pinned. En la práctica: un extractor de siniestros manda a una persona solo los campos en los que las tres variantes se dividieron, y auto-aprueba los unánimes.',
  's05.h7':
    'Extracción estructurada en la que puedes confiar a nivel de esquema',
  's05.p7':
    'Facturas, contratos, documento-a-JSON: salida que cumple cada vez, el mismo documento que produce la misma fila. La generación está restringida por gramática, validada, luego reparada o <em>falla en voz alta</em> — nunca basura de apariencia plausible pasada aguas abajo.',
  's05.h8':
    'A/B testing con una señal limpia',
  's05.p8':
    'Para saber si el prompt v2 le gana a v1, debes eliminar la varianza de salida o no puedes separar una mejora real de la suerte del muestreo. DAOS la quita, así cualquier cambio en la salida es atribuible al cambio que hiciste — el experimento mide lo que estás probando. En la práctica: el prompt v2 sale detrás de un flag y reejecutas el mismo set de eval — el delta de salida es el prompt, no el sampler.',
  's05.h9':
    'Investigación, benchmarks y evals reproducibles',
  's05.p9':
    'Los resultados solo son creíbles cuando otra persona reejecuta tu eval publicada en su propia máquina. <b>Medido:</b> reejecutar la misma tripleta en un proceso nuevo con una nueva clave de firma devolvió los mismos bytes, 0 inferencias — la eval mide el modelo, no el piso de ruido. Extender eso a una segunda máquina es el <b>alcance de diseño</b>: la identidad byte se cumple entre máquinas que ejecutan una misma cuantización y un mismo backend, nunca a través de un cambio de backend.',
  's05.h10':
    'Forense de incidentes sobre el comportamiento en producción',
  's05.p10':
    'Cuando sale una salida mala, el primer paso — reproducirla — suele ser el más difícil, porque las condiciones ya no están. DAOS reproduce la ejecución exacta desde su log firmado con cero inferencias. Y si el replay no coincide, esa divergencia se marca ella misma como un bug detectado. En la práctica: un cliente disputa una respuesta de hace tres semanas; reproduces la ejecución registrada y ves los bytes exactos que vio, no una aproximación.',
  's06.h2':
    'Dónde DAOS no es la respuesta',
  's06.intro':
    'La honestidad es parte del pitch — la disciplina que produce la garantía produce un límite claro a su alrededor.',
  's06.h3a':
    '<span class="x">×</span> Generación abierta o creativa',
  's06.pa':
    'DAOS restringe la salida a un esquema y premia el acuerdo. Si quieres variedad, es la capa equivocada.',
  's06.h3b':
    '<span class="x">×</span> Corrección',
  's06.pb':
    'DAOS hace la salida <em>estable</em>, no <em>verdadera</em>. Una respuesta equivocada se fija tan fiablemente como una correcta — el determinismo es ortogonal a la exactitud, y el producto solo reclama lo primero.',
  's06.h3c':
    '<span class="x">×</span> Tokens idénticos bit a bit entre cuantizaciones',
  's06.pc':
    'Matemáticamente imposible — la cuantización cambia la función calculada. DAOS garantiza el nivel semántico y lo dice, en lugar de reclamar lo imposible.',
  's06.h3d':
    '<span class="x">×</span> Quórum cross-quant en producción',
  's06.pd':
    'Es investigación de Track B sin ninguna afirmación de exactitud; el core lanza <span class="mono">UnsupportedMode</span>. El producto lanzado es el modo pinned — una variante designada.',
  's06.h3e':
    '<span class="x">×</span> Paridad de latencia con una sola llamada',
  's06.pe':
    'La resolución cuesta inferencia en la primera llamada, luego cachea. Compras el determinismo con cómputo: un coste real en frío, una lookup en caliente.',
  's06.h3f':
    '<span class="x">×</span> Detectar que un modelo derivó',
  's06.pf':
    'El replay prueba la pipeline, no el modelo — consume la salida de ayer, así que un modelo que cambió aún reproduce en verde. Eso es detección de deriva: en la hoja de ruta.',
  'close.kicker':
    'La conclusión',
  'close.h2':
    'Si la varianza te está costando, DAOS es la capa que la elimina.',
  'close.lead':
    'Testeabilidad, auditabilidad, corrección de caché, un experimento limpio — cuando “una respuesta distinta cada vez” es el problema, el modo pinned te entrega una función pura, con los recibos para probarlo. No una temperatura más baja. Un punto fijo.',
  'footer.guarantee':
    'Garantía a nivel semántico · SPEC v1.6',
};

const de: DaosDict = {
  'hero.kicker':
    'Determinismus als Laufzeitgarantie',
  'hero.h1':
    'Gleiche Eingabe.<br>Die <span class="id">byte-identische</span> Ausgabe.<br>Jedes Mal.',
  'hero.lede':
    'Ein LLM gibt bei jedem Aufruf eine andere Antwort. DAOS macht aus diesem Aufruf eine reine Funktion: Eingabe, Kontext und Schema lösen sich <em>einmal</em> zu einem kanonischen Ausgabeobjekt auf, das dann fixiert, signiert und Byte für Byte reproduziert wird — über die Zeit hinweg und auf jeder Maschine, die dieselbe festgelegte Variante und dasselbe Backend ausführt.',
  'proof.cap1':
    'Pinned-Modus',
  'proof.cap2':
    'das ausgelieferte Produkt',
  'proof.resolve':
    'Einmal auflösen',
  'proof.cost1':
    '1 Inferenz',
  'proof.ticket':
    '“…$49.99 diesen Monat zweimal berechnet…”',
  'proof.step':
    'auflösen · greedy → kanonisieren → in Cache signieren',
  'proof.reproduce':
    'Diesen Lauf reproduzieren',
  'proof.cost0':
    '0 Inferenz',
  'proof.when':
    'ein Golden-Test in CI · ein Prüfer · eine zweite Maschine',
  'proof.replay':
    '—&nbsp;dieselben Bytes&nbsp;—',
  'proof.subnote':
    'Du wartest nicht, bis dasselbe Ticket ein zweites Mal eintrifft — du <b>reproduzierst den Lauf, der dich interessiert</b>, Byte für Byte, aus seiner protokollierten Eingabe. Determinismus ist eine Eigenschaft der <b>Funktion</b>, keine Wette auf wiederkehrenden Traffic. Die Reproduktion in einem frischen Prozess ist <b>gemessen</b> (§&thinsp;04); eine zweite Maschine gilt <b>konstruktionsbedingt</b>, innerhalb einer Quantisierung und eines Backends.',
  'proof.footK':
    'Gemessen',
  'proof.footV':
    '20 Greedy-Läufe → 1 Ausgabe · in einem frischen Prozess reproduziert, 0 Inferenz',
  'hero.fnComment':
    '// eine reine Funktion auf der semantischen Ebene — eine festgelegte Variante, einmal aufgelöst, Byte für Byte reproduziert',
  'nc.p':
    '<span class="sl-callout__title">Das ist kein Cache</span>Ein nicht-deterministisches Modell zu memoisieren ist ein <b>Korrektheits-Bug</b>: Es liefert eine Antwort, die das Modell nicht mehr geben würde, und kann nicht erkennen, dass sie falsch ist. DAOS verdient sich das Recht zu cachen <b>zuerst</b> — Modell-Hash und Ladekonfiguration fließen in den Schlüssel ein, sodass ein Modellwechsel <b>invalidiert</b>, statt Veraltetes zu liefern, und ein Replay, das nicht zum signierten Log passt, wird als <b>erkannter Bug</b> markiert. Der Store liegt hinter der Garantie, er ist nicht das Produkt.',
  's01.kicker':
    'Das hast du schon versucht',
  's01.h2':
    '<span class="k">temperature=0</span> ist kein Determinismus. Es ist eine leisere Art von Glück.',
  's01.tag1':
    'Der Konfigurationsregler',
  's01.h3a':
    'Den Sampler herunterdrehen',
  's01.p1':
    'Setze <span class="mono">temperature=0</span>, <span class="mono">top_k=1</span>, <span class="mono">top_p</span> niedrig, und die <em>Auswahlregel</em> wird deterministisch: nimm immer das Argmax-Token. In unseren eigenen Läufen hielt es sogar — 20 aufeinanderfolgende Greedy-Generierungen, vier Seeds, einer unter einem konkurrierenden Thread auf derselben Maschine: <b class="ink">eine einzige eindeutige Ausgabe</b>.',
  's01.note1':
    'Also auf einer Variante, einem Backend, einer Maschine kann Greedy byte-stabil sein. Genau dort hören die meisten Teams auf — und genau dort existiert die Garantie, die sie zu haben glauben, nicht.',
  's01.tag2':
    'Warum das nicht reicht',
  's01.h3b':
    'Greedy entfernt eine von sechs Rauschschichten',
  's01.p2':
    'Das Argmax ist deterministisch, aber die <em>Werte, über die es wählt</em>, sind nicht stabil auf den Achsen, die zählen. Fünf Schichten überstehen <span class="mono">temperature=0</span> unberührt:',
  's01.li1':
    'Sampling-Entropie — die einzige Schicht, die eine niedrige Temperatur entfernt',
  's01.li2':
    'Gleitkomma-Nichtassoziativität in GPU-Kernel-Reduktionen',
  's01.li3':
    'Continuous Batching, das die Numerik deines Aufrufs verändert',
  's01.li4':
    'Quantisierung — eine andere Bitbreite berechnet eine andere Funktion <span class="tie">— gemessen: Q4 wich von FP16 bei 9 von 40 Feldern ab (§04)</span>',
  's01.li5':
    'stilles Modell-Drift auf einem gehosteten Endpoint',
  's01.li6':
    'Entropie auf Agentenebene — Tool-Reihenfolge, Zeitstempel, Retrieval',
  's01.punch':
    '<span class="mono">temperature=0</span> berechnet die Antwort neu und hofft, dass sie übereinstimmt. Bei einem Token mit geringem Abstand kippt das Argmax — und du bekommst kein Signal, dass es passiert ist, und keine Möglichkeit zu beweisen, dass die heutige Antwort gleich der gestrigen ist. <b>DAOS löst einmal auf, kanonisiert das Objekt, signiert es in einen inhaltsadressierten Cache und reproduziert es — Byte für Byte, 0 Inferenz.</b> Der Pinned-Modus <em>ist</em> Greedy-Decoding, plus die drei Dinge, die ein Regler dir nicht geben kann: eine kanonische Form, einen fixierten Eintrag und eine Quittung.',
  's02.h2':
    'Determinismus weg vom Token-Strom verlagert',
  's02.lead':
    'Manches Nicht-Determinismus lässt sich nicht entfernen — zwei Quantisierungen eines Modells berechnen unterschiedliche Funktionen und werden nie dieselben Tokens ausgeben. Also kämpft DAOS nicht um identische Tokens. Es verlagert den Determinismus-Vertrag auf ein <b class="ink">kanonisiertes, schema-beschränktes Ausgabeobjekt</b>.',
  's02.note1':
    'Das ausgelieferte Produkt ist der <b class="ink">Pinned-Modus</b>: eine festgelegte Variante, eine Generierung, kanonisiert und gegen ein begrenztes Schema validiert, mit dem Modell-Hash der Variante und der Ladekonfiguration im Schlüssel verschmolzen. Das Ergebnis wird in einem inhaltsadressierten, HMAC-signierten Cache eingefroren und in einem signierten, wiederholbaren Event-Log festgehalten.',
  's02.note2':
    'Die Kanonisierung macht die gespeicherten Bytes wohldefiniert: eine rohe Generierung von <span class="mono">confidence: 0.8500000119</span> wird als <span class="mono ink-2">0.85</span> dargestellt — die Zahlenform ist <b class="ink">schema-eigen</b> (<span class="mono">multipleOf&nbsp;0.05</span>) und überschreibt die kürzeste Form des Serialisierers — dann NFC-Unicode, dann JCS-sortierte Schlüssel.',
  's02.note3':
    'Die Garantie ist ein Fixpunkt, auf dem du aufbauen kannst — dieselbe Eingabe löst sich zum selben Ausgabeobjekt auf, und jede Wiederholung ist ein signiertes Replay, kein neuer Wurf. Nicht „meistens gleich“. Gleich.',
  's03.kicker':
    'Neurowissenschaftlich fundiertes Design · Spec-v1.4-Revision',
  'ui.designChoice':
    'Design-Entscheidung',
  's03.h2':
    'Das Problem des stochastischen Substrats ist alt. Gehirne lösten es zuerst.',
  's03.lead':
    'Ein biologisches neuronales System hält einen kohärenten Gedanken auf verrauschter, spikender, unzuverlässiger Hardware. Die Auflösungsschicht von DAOS entleiht drei Mechanismen, die das möglich machen — und wirft bewusst den einen weg, der Gehirne zu unzuverlässigen Zeugen macht.',
  's03.from1':
    '<b>Attraktordynamik</b> <span class="arrow">→</span> gepooltes Decoding',
  's03.h3a':
    'Lass die Population sich setzen, dann lies sie',
  's03.p1':
    'Eine kortikale Population, die mit verrauschter Eingabe gespeist wird, fällt in einen von wenigen stabilen Zuständen und säubert dabei das Rauschen auf dem Weg nach unten. Die Logit-Pool-Strategie von DAOS macht dasselbe: sie mittelt die Wahrscheinlichkeits-<em>Verteilungen</em> der Varianten bei jedem Schritt und übergibt das gepoolte Token allen im Gleichschritt — sie löst das Ensemble in eine diskrete Wahl auf, <em>bevor</em> sie zum Argmax kollabiert, nicht danach.',
  's03.c1':
    'R7.7 · aggregiere Wahrscheinlichkeiten, nie rohe Logits · erfordert einen gemeinsamen Tokenizer (nur cross-quant) und In-Process-Zugriff auf Schrittebene — schließt vLLM / LM Studio / TGI aus.',
  's03.from2':
    '<b>Populationscodierung</b> <span class="arrow">→</span> die Korrelationsdecke',
  's03.h3b':
    'Mitteln skaliert nur bei unabhängigem Fehler',
  's03.p2':
    'Das Poolen von N Neuronen unterdrückt Rauschen wie √N — aber nur, wenn ihre Fehler unabhängig sind. Korreliertes Rauschen erzwingt eine harte Decke. Derselbe Satz begrenzt ein Quorum: der Quantisierungsfehler ist <em>systematisch</em>, also erreicht das Stapeln weiterer Bitbreiten-Varianten schnell ein Plateau. DAOS benennt diese Grenze, statt sie zu verbergen — dekorreliere mit verschiedenen Quantisierungs-<em>Methoden</em>, füge nicht einfach mehr hinzu.',
  's03.c2':
    'R7.8 · eine offengelegte Grenze, keine behauptete Funktion · dieselbe informationsbegrenzende Korrelation, die in der Populationscodierung untersucht wird.',
  's03.from3':
    '<b>Prädiktive Codierung</b> <span class="arrow">→</span> ein deklarierter Prior',
  's03.h3c':
    'Gewichte Mehrdeutigkeit zu einem Prior',
  's03.p3':
    'Das Gehirn stabilisiert einen mehrdeutigen Perzept, indem es ihn zu einem Prior gewichtet. DAOS bricht eine Stimmengleichheit auf dieselbe Weise, mit einem schema-deklarierten Prior — und <em>lehnte</em> den verlockenden „Prior = ähnlichste vergangene Antwort“ pointiert ab, weil eine Ähnlichkeitsfunktion den Nicht-Determinismus direkt wieder einschmuggelt.',
  's03.c3':
    'R3.3(a) · nur als reine, versionierte Funktion des protokollierten Zustands erlaubt · Token-ID-Rückfall beibehalten.',
  's03.from4':
    'Die eine, die wir wegwarfen: <b>Konfabulation</b>',
  's03.h3d':
    'Der Interpret, der Kohärenz erfindet',
  's03.p4':
    'Split-Brain-Forschung zeigt den Geist, wie er <em>nach</em> dem Ereignis eine kohärente Geschichte fabriziert — und ihr glaubt. Diese nachträgliche Kohärenz ist genau das Anti-Ziel von DAOS: reproduzierbar ist nicht dasselbe wie vertrauenswürdig. Genau der Mechanismus, der ein Gehirn sich sicher fühlen lässt, ist der, den eine Determinismus-Engine verweigern muss.',
  's03.tagline':
    'Im Review abgelehnt · eine Maschine, die ihre eigene Gewissheit fabriziert, ist der Fehlermodus, nicht die Funktion.',
  's03.foot':
    'Logit-Pool (R7.7) ist eine Auflösungsstrategie auf Spec-Ebene für die Track&nbsp;B-Forschung, kein Schalter, den ein Konsument heute umlegt — dieselbe Ehrlichkeit, die den Rest dieser Seite bestimmt.',
  's04.kicker':
    'An realen Modellen gemessen, nicht nur entworfen',
  's04.h2':
    'Llama-3.2 in drei Bitbreiten, auf einem Apple M3 Pro.',
  's04.mlabel1':
    'Das Produkt · Pinned-Modus',
  's04.lab1':
    'zwanzig aufeinanderfolgende Greedy-Generierungen der Pinned-Variante — eine einzige eindeutige Ausgabe, stabil unter vier Seeds und einem konkurrierenden Thread',
  's04.lab2':
    'Inferenzaufrufe, um einen protokollierten Lauf zu reproduzieren — Byte für Byte in einem frischen Prozess mit einem neuen Signaturschlüssel reproduziert',
  's04.mlabel2':
    'Der Stresstest <span class="sl-tag">Track&nbsp;B · research</span>',
  's04.lab3':
    'kanonisches Objekt, versöhnt aus drei Quantisierungsvarianten eines Modells — eine höhere Latte als Determinismus mit einer einzigen Variante',
  's04.lab4':
    'Q4-Alleinminderheitsrate; FP16 war nie die Alleinminderheit — Dissens ist monoton in der Präzision',
  's04.capA':
    'Cross-Quant-Auflösung',
  's04.capB':
    '1 Basismodell · 3 Bitbreiten',
  's04.leaf':
    'Abstimmung über das Blatt <b>priority</b>',
  's04.lone':
    '← Alleinminderheit',
  's04.collapse':
    'feldweise Mehrheit',
  's04.subnote':
    'Der Dissens von Q4 wird protokolliert und das Feld als <b>fragil</b> markiert. Die Schiedsrichterregel (höchste Präzision gewinnt) greift nur bei <em>mehrheitslosen</em> Gleichständen — hier entscheidet die 2–1-Mehrheit bereits.',
  's04.foot':
    'Von 40 aufgelösten Feldern waren 31 einstimmig und 9 spalteten sich 2–1 über 6 der 10 Aufgaben — wo Byte-Identität durch Auflösung erzeugt wurde, nicht dadurch, dass drei Varianten zufällig übereinstimmen. Das Quorum kaufte <em>Determinismus</em>, nicht Genauigkeit: Cross-Quant erhebt keinen Genauigkeitsanspruch, und der Core liefert es nicht mehr als Produktfläche aus.',
  's05.h2':
    'Zehn Stellen, an denen es sich auszahlt',
  's05.h1':
    'LLM-Features überhaupt testbar machen',
  'ui.howItWorks':
    'So funktioniert es',
  's05.p1':
    'Man kann nicht gegen ein bewegliches Ziel assertieren, also hören Teams auf, die Tests zu schreiben. Mit einer festen Ausgabe bedeutet ein Golden-Test wieder etwas: eine Prompt- oder Modelländerung wird zu einem Diff, den du prüfst, nicht zu Rauschen, das du zu ignorieren lernst.',
  's05.h2c':
    'Audit und Compliance in regulierten Bereichen',
  's05.p2':
    'Finanzen, Versicherung, Gesundheit: „warum hat es das produziert, und kannst du es reproduzieren?“ — manchmal Jahre später, gegenüber einer Aufsichtsbehörde. DAOS protokolliert jede Auflösung in einem signierten, nur-anhängenden Log und reproduziert den exakten Lauf auf Abruf. Manipulationssicher durch Signatur; reproduzierbar durch Konstruktion.',
  's05.h3':
    'Quantisierung oder Backend migrieren',
  's05.p3':
    'Wechsle zum günstigeren Q4-Modell oder zu einem neuen Inferenzserver ohne stille Verhaltensänderung. Das Cross-Quant-Quorum von Track B löste FP16, Q8 und Q4 zu einem kanonischen Objekt auf — Beleg dafür, dass die semantische Ebene einen Bitbreitenwechsel übersteht. Es sagt dir, dass eine Migration <em>sicher zu testen</em> ist, beweisbar mit einem Vorher/Nachher-Replay; es ist ein Forschungsergebnis, kein Produktumschalter. In der Praxis: ein Plattform-Team fixiert Q4 aus Kostengründen und lässt dann die Golden-Inputs des letzten Quartals erneut laufen, um vor dem Rollout zu beweisen, dass der Wechsel nichts geändert hat.',
  's05.h4':
    'Deterministisches Caching und k×-Kostenkontrolle',
  's05.p4':
    'Die erste Auflösung schreibt die Antwort einmal; jede semantisch identische Anfrage danach ist ein Cache-Hit, der die Inferenz überspringt. Der Cache-Schlüssel ist die kanonische Form der Eingabe, sodass <span class="mono">0.9</span> und <span class="mono">0.90</span> oder umsortierte Schlüssel zu einem Eintrag kollabieren. Determinismus ist das, was die Wiederverwendung <em>korrekt</em> macht.',
  's05.h5':
    'Stabile Verträge zwischen Pipeline-Stufen',
  's05.p5':
    'In einem mehrstufigen Agenten konsumiert jede Stufe die Ausgabe der vorigen; Rauschen weiter oben kaskadiert und Fehler hören auf, sich zu reproduzieren. Ein schema-förmiger Vertrag an jeder Grenze macht die ganze Pipeline reproduzierbar und heftet einen Fehler an die Stufe, die ihn verursacht hat. In der Praxis: eine nächtliche Dokument-Pipeline lässt extract → classify → route auf denselben Eingaben erneut laufen, sodass eine Regression ein prüfbarer Diff an einer Stufe ist, kein Rätsel, das drei Stufen später auftauchte.',
  's05.h6':
    'Uneinigkeit als Konfidenzsignal',
  's05.p6':
    'Wenn FP16, Q8 und Q4 sich bei einem Feld spalten, ist dieses Feld fragil — geringer Abstand, die Art, die unter Batching oder einem Modell-Update kippt. Das Quorum protokolliert die feldweise Abstimmung und schreibt jeden Dissens seiner Variante zu, sodass umstrittene Felder ins Review gehen und einstimmige unberührt laufen. Eine Forschungsfähigkeit, nicht Teil des Pinned-Produkts. In der Praxis: ein Schadenextraktor schickt einem Menschen nur die Felder, bei denen sich die drei Varianten spalteten, und genehmigt die einstimmigen automatisch.',
  's05.h7':
    'Strukturierte Extraktion, der du auf Schema-Ebene vertrauen kannst',
  's05.p7':
    'Rechnungen, Verträge, Dokument-zu-JSON: Ausgabe, die jedes Mal konform ist, dasselbe Dokument, das dieselbe Zeile liefert. Die Generierung ist grammatik-beschränkt, validiert, dann repariert oder <em>schlägt laut fehl</em> — nie plausibel aussehender Müll, der weitergereicht wird.',
  's05.h8':
    'A/B-Testing mit einem sauberen Signal',
  's05.p8':
    'Um zu wissen, ob Prompt v2 v1 schlägt, musst du die Ausgabevarianz entfernen, sonst kannst du einen echten Gewinn nicht vom Glück der Stichprobe trennen. DAOS entfernt sie, sodass jede Änderung in der Ausgabe der von dir gemachten Änderung zuzuschreiben ist — das Experiment misst das, was du testest. In der Praxis: Prompt v2 geht hinter einem Flag live und du lässt dasselbe Eval-Set erneut laufen — das Ausgabe-Delta ist der Prompt, nicht der Sampler.',
  's05.h9':
    'Reproduzierbare Forschung, Benchmarks, Evals',
  's05.p9':
    'Ergebnisse sind nur glaubwürdig, wenn jemand anderes deine veröffentlichte Eval auf seiner eigenen Maschine erneut laufen lässt. <b>Gemessen:</b> dieselbe Tripel in einem frischen Prozess mit einem neuen Signaturschlüssel erneut auszuführen lieferte dieselben Bytes, 0 Inferenz — die Eval misst das Modell, nicht den Rauschboden. Das auf eine zweite Maschine auszudehnen ist der <b>Design-Bereich</b>: Byte-Identität gilt zwischen Maschinen, die eine Quantisierung und ein Backend ausführen, nie über einen Backend-Wechsel hinweg.',
  's05.h10':
    'Incident-Forensik zum Verhalten in der Produktion',
  's05.p10':
    'Wenn eine schlechte Ausgabe ausgeliefert wird, ist der erste Schritt — sie zu reproduzieren — meist der schwierigste, weil die Bedingungen weg sind. DAOS reproduziert den exakten Lauf aus seinem signierten Log mit null Inferenz. Und wenn das Replay nicht übereinstimmt, wird diese Divergenz selbst als erkannter Bug markiert. In der Praxis: ein Kunde bestreitet eine Antwort von vor drei Wochen; du reproduzierst den protokollierten Lauf und siehst die exakten Bytes, die er sah, keine Näherung.',
  's06.h2':
    'Wo DAOS nicht die Antwort ist',
  's06.intro':
    'Ehrlichkeit ist Teil des Pitches — die Disziplin, die die Garantie erzeugt, erzeugt eine klare Grenze um sie herum.',
  's06.h3a':
    '<span class="x">×</span> Offene oder kreative Generierung',
  's06.pa':
    'DAOS beschränkt die Ausgabe auf ein Schema und belohnt Übereinstimmung. Wenn du Vielfalt willst, ist es die falsche Schicht.',
  's06.h3b':
    '<span class="x">×</span> Korrektheit',
  's06.pb':
    'DAOS macht die Ausgabe <em>stabil</em>, nicht <em>wahr</em>. Eine falsche Antwort fixiert sich so zuverlässig wie eine richtige — Determinismus ist orthogonal zur Genauigkeit, und das Produkt beansprucht nur Ersteres.',
  's06.h3c':
    '<span class="x">×</span> Bitweise identische Tokens über Quantisierungen',
  's06.pc':
    'Mathematisch unmöglich — Quantisierung ändert die berechnete Funktion. DAOS garantiert die semantische Ebene und sagt das, statt das Unmögliche zu beanspruchen.',
  's06.h3d':
    '<span class="x">×</span> Cross-Quant-Quorum in der Produktion',
  's06.pd':
    'Es ist Track-B-Forschung ohne Genauigkeitsanspruch; der Core wirft <span class="mono">UnsupportedMode</span>. Das ausgelieferte Produkt ist der Pinned-Modus — eine festgelegte Variante.',
  's06.h3e':
    '<span class="x">×</span> Latenzgleichheit mit einem einzelnen Aufruf',
  's06.pe':
    'Die Auflösung kostet Inferenz beim ersten Aufruf, dann cacht sie. Du kaufst Determinismus mit Rechenleistung: echte Kosten kalt, eine Lookup warm.',
  's06.h3f':
    '<span class="x">×</span> Erkennen, dass ein Modell gedriftet ist',
  's06.pf':
    'Replay beweist die Pipeline, nicht das Modell — es konsumiert die gestrige Ausgabe, sodass ein Modell, das sich geändert hat, trotzdem grün wiederholt. Das ist Drift-Erkennung: auf der Roadmap.',
  'close.kicker':
    'Das Fazit',
  'close.h2':
    'Wenn die Varianz dich kostet, ist DAOS die Schicht, die sie entfernt.',
  'close.lead':
    'Testbarkeit, Auditierbarkeit, Cache-Korrektheit, ein sauberes Experiment — wenn „jedes Mal eine andere Antwort“ das Problem ist, gibt dir der Pinned-Modus eine reine Funktion, mit den Belegen, es zu beweisen. Keine niedrigere Temperatur. Ein Fixpunkt.',
  'footer.guarantee':
    'Garantie auf semantischer Ebene · SPEC v1.6',
};

export const DAOS_I18N: Record<DaosLang, DaosDict> = { en, it, es, de };

/** Narrows any string to a supported language, or null. */
export function asDaosLang(value: string | null | undefined): DaosLang | null {
  return DAOS_LANGS.find((l) => l === value) ?? null;
}

/**
 * The language to show: a remembered pick first, then the first of the
 * browser's preferred languages whose primary subtag is supported (`it-IT` →
 * `it`), then English. Pure so the rule is testable outside a browser.
 */
export function resolveDaosLang(stored: string | null, preferred: readonly string[]): DaosLang {
  const remembered = asDaosLang(stored);
  if (remembered) return remembered;
  for (const tag of preferred) {
    const lang = asDaosLang(tag.split('-')[0]?.toLowerCase());
    if (lang) return lang;
  }
  return 'en';
}
