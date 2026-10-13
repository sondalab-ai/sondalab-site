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

/** The switch's labels: each language named in itself, in sentence case. */
export const DAOS_LANG_NAMES: Record<DaosLang, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  de: 'Deutsch',
};

const en = {
  'hero.kicker':
    'Same question, same answer',
  'hero.h1':
    'Ask once.<br>Get the <span class="id">same answer</span><br>every time after.',
  'hero.lede':
    'Ask an AI model the same thing twice and you can get two different answers. That breaks tests, audits and bug reports. DAOS asks the model <em>once</em>, signs the answer so any later edit is caught, and gives back exactly that answer, byte for byte, whenever the same request comes in, without calling the model again.',
  'proof.cap1':
    'One support ticket',
  'proof.cap2':
    'what ships today',
  'proof.resolve':
    'The first time',
  'proof.cost1':
    '1 model call',
  'proof.ticket':
    '“…charged $49.99 twice this month…”',
  'proof.step':
    'the model answers → DAOS tidies the answer → signs it and stores it',
  'proof.reproduce':
    'Every time after',
  'proof.cost0':
    '0 model calls',
  'proof.when':
    'a test run · an auditor · a bug report weeks later',
  'proof.replay':
    '—&nbsp;the same bytes&nbsp;—',
  'proof.subnote':
    "You don't have to wait for the same ticket to come in again: you can <b>replay any logged run</b> and get back exactly what the model said at the time. Replaying in a fresh process is <b>measured</b>. On a second machine it should hold <b>by design</b>, as long as that machine runs the same model file on the same inference software.",
  'proof.footK':
    'Measured',
  'proof.footV':
    '20 runs → 1 answer · replayed in a fresh process with 0 model calls',
  'hero.fnComment':
    '// same request in, same answer out: one chosen model, asked once, then replayed',
  'nc.p':
    `<span class="sl-callout__title">Isn't this just a cache?</span>No, and a plain cache would be risky. If the model changes, a cache keeps serving an answer the model would no longer give, and nothing tells you. DAOS ties every stored answer to the exact model that produced it, so <b>swapping the model means the old answers are not used</b>. Every answer is signed, so <b>an edited answer is caught</b>. And if replaying a run gives something other than what the log says, DAOS <b>reports it as a bug</b>.`,
  'why.kicker':
    'You may have tried this',
  'why.h2':
    '<span class="k">temperature=0</span> makes a model less random. It does not make it repeatable.',
  'why.tag1':
    'What people try',
  'why.h3a':
    'Turn the randomness down',
  'why.p1':
    `Set <span class="mono">temperature=0</span> and the model always picks its most likely next word. In our own tests that held: 20 runs in a row, across four different seeds and with another job competing for the machine during one of them, gave <b class="ink">one single answer</b>.`,
  'why.note1':
    'So with one model on one machine it can work. Most teams stop there, and assume they have a guarantee they do not actually have.',
  'why.tag2':
    'Why it is not enough',
  'why.h3b':
    'Randomness is only one of six things that change the answer',
  'why.p2':
    'The model still picks its most likely word, but <em>which</em> word counts as most likely can shift for reasons that have nothing to do with temperature. Five of them are untouched by <span class="mono">temperature=0</span>:',
  'why.li1':
    'random sampling: the only one a low temperature removes',
  'why.li2':
    'tiny rounding differences in how a GPU adds up numbers',
  'why.li3':
    'the server processing your request together with other people’s',
  'why.li4':
    `a smaller, compressed copy of the model, which is really a slightly different model <span class="tie">(see §06)</span>`,
  'why.li5':
    'a hosted model being updated without notice',
  'why.li6':
    'everything else in an agent: the order tools run in, timestamps, search results',
  'why.punch':
    `<span class="mono">temperature=0</span> asks the model again and hopes the answer matches. When two words are almost equally likely, it can tip the other way, and nothing tells you it did. <b>DAOS asks once, keeps that answer, and hands it back every time after, byte for byte, with no model call.</b> It uses the same low-randomness setting, and adds what a setting cannot give you: one fixed form for the answer, a stored copy, and a signed record.`,
  'how.h2':
    'How it works',
  'how.lead':
    'You cannot stop a model from varying, so DAOS does not try. It asks <b class="ink">one chosen model</b> once, and makes that answer the official one.',
  'how.note1':
    '<b class="ink">1. Ask once.</b> You send the input along with a <em>schema</em>: the exact shape the answer must have, meaning its fields, allowed values and number precision. DAOS asks the model and checks the answer against the schema. An answer that does not fit is an error, never passed on as if it were fine.',
  'how.note2':
    '<b class="ink">2. Tidy it up.</b> Two answers that mean the same thing should be the same bytes. So a raw <span class="mono">0.8500000119</span> becomes <span class="mono ink-2">0.85</span> (the schema sets the precision), text is normalised, and fields are put in a fixed order.',
  'how.note3':
    `<b class="ink">3. Sign, store, replay.</b> The tidy answer is signed and stored. From then on the same request gets the stored answer back, without calling the model. Turn on the log and each run is also recorded in a signed log, so you can replay it later.`,
  'measured.kicker':
    'Measured, not just promised',
  'measured.h2':
    'Tested on a real model: Llama-3.2, on an Apple M3 Pro.',
  'measured.label':
    'The product',
  'measured.n1':
    `runs in a row of the same request gave one single answer, across four different seeds, one of them with another job competing for the machine`,
  'measured.n2':
    'model calls to replay a logged run, byte for byte, in a fresh process with a new signing key',
  'uses.h2':
    'What you can do with it',
  'ui.realOutput':
    'Real output',
  'uses.h1':
    'Write tests for AI features that mean something',
  'uses.p1':
    'You cannot test against an answer that keeps changing, so teams stop writing the tests. With DAOS you save the answer for a known input as the expected result, and the test checks it on every build. When someone changes the prompt or the model, the test shows exactly what changed: a difference to review, not noise to ignore.',
  'uses.h2c':
    'Show an auditor exactly what the model said',
  'uses.p2':
    `Finance, insurance, healthcare: “why did it decide this, and can you show it again?”, sometimes years later. With logging on, every answer goes into a signed log that cannot be edited without it being detected, and DAOS replays that exact run on request.`,
  'uses.h3':
    'Reproduce a bad answer from production',
  'uses.p3':
    'When a bad answer reaches a customer, the hardest step is reproducing it, because the conditions are gone. A customer disputes an answer from three weeks ago: you replay the logged run and see the exact bytes they saw, not an approximation. If the replay does not match the log, that mismatch is reported as a bug.',
  'uses.h4':
    'Pull data out of documents into a fixed shape',
  'uses.p4':
    'Invoices, contracts, support tickets into JSON. Every answer is checked against the schema you define, and one that does not fit fails with the exact reason, instead of plausible-looking garbage reaching the next step. The same document always gives the same row.',
  'uses.h5':
    'Stop paying twice for the same answer',
  'uses.p5':
    'The first request pays for one model call. Every later request that means the same thing is served from storage: <span class="mono">0.9</span> and <span class="mono">0.90</span>, or the same fields in a different order, count as one request. Because the model is part of the key, switching models never serves an old answer.',
  'uses.h6':
    'Compare two prompts fairly',
  'uses.p6':
    'To know whether prompt v2 beats v1, you have to remove the random variation, or you cannot tell a real improvement from luck. Run the same test set with each prompt: with the randomness gone, any difference in the output comes from the prompt.',
  'ui.commands':
    `The commands`,
  'uses.h7':
    `Use it from the tools you already have`,
  'uses.p7':
    `DAOS can run as a local server that speaks the OpenAI chat API, so an app that already talks to OpenAI only needs a new address. Two catches: your schema has to set limits on every field (allowed values, a maximum length, a range for numbers), and the server only listens on your own machine.`,
  'uses.h8':
    `Find wrong answers before your users do`,
  'uses.p8':
    `A stored answer is repeated faithfully even when it is wrong. So a daily check takes the new answers, plus a rotating share of older ones, and asks a stronger model (Claude) and a web search whether they hold up. It withdraws an answer on its own only where your rules say so; everything else goes into a report for you to review.`,
  'uses.h9':
    `Correct one stored answer without starting over`,
  'uses.p9':
    `When an answer turns out to be wrong, you withdraw that one answer, or replace it with a fixed one, and leave everything else as it is. Until a fix is in place, that request returns a clear error instead of the wrong answer. Who changed it, and why, is recorded with the change.`,
  'limits.h2':
    'What DAOS does not do',
  'limits.intro':
    'The same discipline that makes the guarantee also draws a clear line around it.',
  'limits.h3a':
    '<span class="x">×</span> Creative or open-ended writing',
  'limits.pa':
    'DAOS forces answers into a fixed shape and keeps them the same. If you want variety, it is the wrong tool.',
  'limits.h3b':
    '<span class="x">×</span> Making answers correct',
  'limits.pb':
    `DAOS makes answers <em>stable</em>, not <em>right</em>. A wrong answer is repeated just as faithfully as a right one. The daily check and the correction command (§04) help you find and fix wrong answers; they do not prevent them.`,
  'limits.h3c':
    '<span class="x">×</span> A free first call',
  'limits.pc':
    'The first time, the model still has to answer, at full cost and speed. Only the repeats are instant and free.',
  'limits.h3d':
    '<span class="x">×</span> Noticing that a model changed',
  'limits.pd':
    'Replaying a run reuses the stored answer, so a model that now answers differently still replays fine. Detecting that is planned, not built.',
  'limits.h3e':
    `<span class="x">×</span> The same answer after changing the model or how it runs`,
  'limits.pe':
    `The guarantee covers one model file loaded with the same settings. A different file or different load settings count as a new model, so DAOS asks again, and the new answer may differ. Moving the same model to different inference software is not covered at all.`,
  'limits.h3f':
    '<span class="x">×</span> Replaying calls that were never logged',
  'limits.pf':
    'Only runs written to the signed log can be replayed. A call made without a log gets the stored answer but leaves nothing to replay.',
  'research.kicker':
    'Research · not in the product',
  'research.h2':
    'What we are still exploring',
  'research.intro':
    'Everything above ships today. This section is different: experiments and design ideas from the DAOS spec that are <b>not</b> in the product. They are here because they shaped it, and because some of them did not work out.',
  'research.qh3':
    'Can three copies of one model vote on the answer?',
  'research.qp':
    'We ran one model in three sizes, at full precision and compressed to 8-bit and 4-bit, and had them vote field by field. Where they disagreed the majority won, so all three always ended up with the same final answer.',
  'research.n1':
    'final answer from three differently compressed copies of one model, every time',
  'research.n2':
    'of fields where the 4-bit copy was the only one to disagree; the full-precision copy never was',
  'research.capA':
    'Three copies vote',
  'research.capB':
    '1 model · 3 sizes',
  'research.leaf':
    'Voting on the <b>priority</b> field',
  'research.lone':
    '← the only one to disagree',
  'research.collapse':
    'the majority wins',
  'research.subnote':
    `The 4-bit copy's disagreement is recorded and the field is marked <b>fragile</b>. A tie-break rule (the most precise copy wins) exists for when there is no majority; here the two-to-one majority already decides.`,
  'research.foot':
    'Of 40 fields, 31 got the same value from all three copies and 9 split two to one, across 6 of the 10 tasks. What the vote did <em>not</em> do is make answers more accurate: on 600 labelled tasks it was no better than the full-precision copy alone. The copies tend to make the same mistakes, so a majority just repeats them. That is why voting is not in the product.',
  'research.i1h':
    'Switching to a cheaper copy of the model, safely',
  'research.i1p':
    'If a 4-bit copy gives the same final answers as the full model, you could switch to it to save money, and replay last quarter’s inputs to show nothing changed. The experiment suggests this can work. It is not a product feature.',
  'research.i2h':
    'Disagreement as a warning light',
  'research.i2p':
    'A field where the copies disagree is a field the model is unsure about. Because the vote records who disagreed, those fields could go to a person while the rest run untouched.',
  'brain.kicker':
    'Ideas borrowed from neuroscience',
  'ui.notBuilt':
    'In the spec',
  'brain.h2':
    'Brains also get one clear thought out of noisy parts.',
  'brain.lead':
    'Neurons are noisy and unreliable, yet a brain settles on one thought. The DAOS spec borrows three tricks that make that possible, and deliberately rejects a fourth. None of them is in the product. One has been measured.',
  'brain.from1':
    '<b>Neurons settling on one state</b> <span class="arrow">→</span> pooled answers',
  'brain.h3a':
    'Let the copies agree before picking each word',
  'brain.p1':
    'A group of neurons given a noisy signal falls into one stable pattern, and cleans up the noise on the way. The spec applies the same idea to copies of a model: at every word, combine how likely each copy finds each option, pick one word together, and move on in step.',
  'brain.c1':
    'Not built. It needs every copy running inside one program, word by word, which common model servers do not allow.',
  'brain.from2':
    '<b>Many neurons voting</b> <span class="arrow">→</span> a limit on voting',
  'brain.h3b':
    'Voting only helps if voters make different mistakes',
  'brain.p2':
    'Adding up many neurons cancels noise, but only when each one makes its own random errors. If they go wrong together, adding more does not help. Compressed copies of one model go wrong together, so adding more of them stops helping quickly. The fix is copies made in genuinely different ways.',
  'brain.c2':
    'Measured: two of our copies were wrong together almost every time (correlation up to 0.978). This is why the vote above did not improve accuracy.',
  'brain.from3':
    '<b>Expectation</b> <span class="arrow">→</span> a stated preference',
  'brain.h3c':
    'Break a near-tie with a stated preference',
  'brain.p3':
    'Faced with something ambiguous, the brain leans toward what it expects. The spec breaks a near-tie between two words the same way: the schema can say which value to prefer. It deliberately does <em>not</em> use “whatever we answered last time for something similar”, because “similar” is fuzzy and would bring randomness back in.',
  'brain.c3':
    'Not built. Without a stated preference, the spec falls back to a fixed rule.',
  'brain.from4':
    'The one we rejected: <b>making up a story</b>',
  'brain.h3d':
    'The part of the mind that invents a reason',
  'brain.p4':
    'Studies of split-brain patients show the mind inventing a convincing explanation after the fact, and believing it. That is exactly what DAOS must not do: giving the same answer every time does not make the answer trustworthy.',
  'brain.tagline':
    'Rejected on purpose: a system that invents its own certainty is the failure, not the feature.',
  'brain.foot':
    'These ideas come from the DAOS spec. They show where the design could go, not features you can switch on today.',
  'close.kicker':
    'In short',
  'close.h2':
    'If getting a different answer every time is costing you, DAOS removes it.',
  'close.lead':
    'Tests that mean something, audits you can answer, bugs you can reproduce, comparisons you can trust. DAOS gives back the same answer for the same request, with a signed record to prove it.',
  'footer.guarantee':
    'Same request, same answer · spec v1.6',
};

export type DaosKey = keyof typeof en;
export type DaosDict = Record<DaosKey, string>;

const it: DaosDict = {
  'hero.kicker':
    'Stessa domanda, stessa risposta',
  'hero.h1':
    'Chiedi una volta.<br>Ottieni la <span class="id">stessa risposta</span><br>ogni volta dopo.',
  'hero.lede':
    `Fai due volte la stessa domanda a un modello di IA e puoi ricevere due risposte diverse. Questo manda in crisi test, audit e segnalazioni di bug. DAOS interroga il modello <em>una sola volta</em>, firma la risposta così che qualsiasi modifica successiva venga scoperta, e restituisce esattamente quella risposta, byte per byte, ogni volta che arriva la stessa richiesta, senza richiamare il modello.`,
  'proof.cap1':
    'Un ticket di assistenza',
  'proof.cap2':
    'ciò che esiste oggi',
  'proof.resolve':
    'La prima volta',
  'proof.cost1':
    '1 chiamata al modello',
  'proof.ticket':
    '“…addebitati $49.99 due volte questo mese…”',
  'proof.step':
    'il modello risponde → DAOS ripulisce la risposta → la firma e la salva',
  'proof.reproduce':
    'Ogni volta dopo',
  'proof.cost0':
    '0 chiamate al modello',
  'proof.when':
    `un'esecuzione di test · un revisore · una segnalazione di bug settimane dopo`,
  'proof.replay':
    '—&nbsp;gli stessi byte&nbsp;—',
  'proof.subnote':
    `Non devi aspettare che arrivi di nuovo lo stesso ticket: puoi <b>rieseguire qualsiasi run registrato</b> e riavere esattamente ciò che il modello disse allora. La riesecuzione in un processo nuovo è <b>misurata</b>. Su una seconda macchina dovrebbe reggere <b>per progetto</b>, purché quella macchina usi lo stesso file del modello e lo stesso software di esecuzione.`,
  'proof.footK':
    'Misurato',
  'proof.footV':
    '20 run → 1 risposta · rieseguito in un processo nuovo con 0 chiamate al modello',
  'hero.fnComment':
    '// stessa richiesta in ingresso, stessa risposta in uscita: un modello scelto, interrogato una volta, poi riprodotto',
  'nc.p':
    `<span class="sl-callout__title">Non è solo una cache?</span>No, e una semplice cache sarebbe rischiosa. Se il modello cambia, una cache continua a servire una risposta che il modello non darebbe più, e nessuno ti avvisa. DAOS lega ogni risposta salvata al modello esatto che l'ha prodotta, quindi <b>cambiare modello significa che le vecchie risposte non vengono usate</b>. Ogni risposta è firmata, quindi <b>una risposta modificata viene scoperta</b>. E se rieseguire un run dà qualcosa di diverso da ciò che dice il registro, DAOS lo <b>segnala come bug</b>.`,
  'why.kicker':
    'Forse ci hai già provato',
  'why.h2':
    '<span class="k">temperature=0</span> rende un modello meno casuale. Non lo rende ripetibile.',
  'why.tag1':
    'Cosa si prova di solito',
  'why.h3a':
    'Abbassare la casualità',
  'why.p1':
    `Imposta <span class="mono">temperature=0</span> e il modello sceglie sempre la parola successiva più probabile. Nei nostri test ha tenuto: 20 run di fila, con quattro seed diversi e, in uno di questi, un altro lavoro in competizione per la macchina, hanno dato <b class="ink">una sola risposta</b>.`,
  'why.note1':
    'Quindi con un modello su una macchina può funzionare. Molti team si fermano qui e credono di avere una garanzia che in realtà non hanno.',
  'why.tag2':
    'Perché non basta',
  'why.h3b':
    'La casualità è solo una delle sei cose che cambiano la risposta',
  'why.p2':
    `Il modello sceglie ancora la parola più probabile, ma <em>quale</em> parola risulti la più probabile può cambiare per motivi che con la temperatura non c'entrano. Cinque di questi non sono toccati da <span class="mono">temperature=0</span>:`,
  'why.li1':
    `campionamento casuale: l'unico che una temperatura bassa elimina`,
  'why.li2':
    'minuscole differenze di arrotondamento nel modo in cui una GPU somma i numeri',
  'why.li3':
    'il server che elabora la tua richiesta insieme a quelle di altri',
  'why.li4':
    `una copia più piccola e compressa del modello, che in realtà è un modello leggermente diverso <span class="tie">(vedi §06)</span>`,
  'why.li5':
    'un modello ospitato che viene aggiornato senza preavviso',
  'why.li6':
    `tutto il resto in un agente: l'ordine in cui girano gli strumenti, gli orari, i risultati di ricerca`,
  'why.punch':
    `<span class="mono">temperature=0</span> chiede di nuovo al modello e spera che la risposta coincida. Quando due parole sono quasi ugualmente probabili, può andare dall'altra parte, e nessuno ti avvisa. <b>DAOS chiede una volta, tiene quella risposta e la restituisce ogni volta dopo, byte per byte, senza chiamare il modello.</b> Usa la stessa impostazione a bassa casualità e aggiunge ciò che un'impostazione non può darti: una forma fissa per la risposta, una copia salvata e un registro firmato.`,
  'how.h2':
    'Come funziona',
  'how.lead':
    `Non puoi impedire a un modello di variare, quindi DAOS non ci prova. Interroga <b class="ink">un modello scelto</b> una volta e rende quella risposta quella ufficiale.`,
  'how.note1':
    `<b class="ink">1. Chiedi una volta.</b> Invii l'input insieme a uno <em>schema</em>: la forma esatta che deve avere la risposta, cioè campi, valori ammessi e precisione dei numeri. DAOS interroga il modello e controlla la risposta rispetto allo schema. Una risposta che non rispetta lo schema è un errore, mai passata avanti come se andasse bene.`,
  'how.note2':
    `<b class="ink">2. Ripulisci.</b> Due risposte che significano la stessa cosa devono essere gli stessi byte. Quindi uno <span class="mono">0.8500000119</span> grezzo diventa <span class="mono ink-2">0.85</span> (la precisione la decide lo schema), il testo viene normalizzato e i campi vengono messi in un ordine fisso.`,
  'how.note3':
    `<b class="ink">3. Firma, salva, riesegui.</b> La risposta ripulita viene firmata e salvata. Da lì in poi la stessa richiesta riceve la risposta salvata, senza chiamare il modello. Attiva il registro e ogni run viene anche annotato in un registro firmato, così puoi rieseguirlo più tardi.`,
  'measured.kicker':
    'Misurato, non solo promesso',
  'measured.h2':
    'Provato su un modello reale: Llama-3.2, su un Apple M3 Pro.',
  'measured.label':
    'Il prodotto',
  'measured.n1':
    `run di fila della stessa richiesta hanno dato una sola risposta, con quattro seed diversi, uno con un altro lavoro in competizione per la macchina`,
  'measured.n2':
    'chiamate al modello per rieseguire un run registrato, byte per byte, in un processo nuovo con una nuova chiave di firma',
  'uses.h2':
    'Cosa ci puoi fare',
  'ui.realOutput':
    'Output reale',
  'uses.h1':
    'Scrivi test per le funzioni di IA che abbiano senso',
  'uses.p1':
    `Non puoi testare contro una risposta che continua a cambiare, quindi i team smettono di scrivere i test. Con DAOS salvi la risposta a un input noto come risultato atteso, e il test la verifica a ogni build. Quando qualcuno cambia il prompt o il modello, il test mostra esattamente cosa è cambiato: una differenza da rivedere, non rumore da ignorare.`,
  'uses.h2c':
    'Mostra a un revisore esattamente cosa ha detto il modello',
  'uses.p2':
    `Finanza, assicurazioni, sanità: “perché ha deciso così, e puoi mostrarlo di nuovo?”, a volte anni dopo. Con il registro attivo, ogni risposta finisce in un registro firmato che non si può modificare senza che la modifica venga scoperta, e DAOS riesegue quel run esatto su richiesta.`,
  'uses.h3':
    'Riproduci una risposta sbagliata finita in produzione',
  'uses.p3':
    `Quando una risposta sbagliata arriva a un cliente, il passo più difficile è riprodurla, perché le condizioni non ci sono più. Un cliente contesta una risposta di tre settimane fa: riesegui il run registrato e vedi i byte esatti che ha visto lui, non un'approssimazione. Se la riesecuzione non coincide con il registro, la differenza viene segnalata come bug.`,
  'uses.h4':
    'Estrai dati dai documenti in una forma fissa',
  'uses.p4':
    `Fatture, contratti, ticket di assistenza in JSON. Ogni risposta viene controllata rispetto allo schema che definisci, e quella che non lo rispetta fallisce con il motivo preciso, invece di far arrivare al passo successivo spazzatura dall'aspetto plausibile. Lo stesso documento dà sempre la stessa riga.`,
  'uses.h5':
    'Smetti di pagare due volte la stessa risposta',
  'uses.p5':
    `La prima richiesta paga una chiamata al modello. Ogni richiesta successiva che significa la stessa cosa viene servita dall'archivio: <span class="mono">0.9</span> e <span class="mono">0.90</span>, o gli stessi campi in un ordine diverso, contano come una sola richiesta. Poiché il modello fa parte della chiave, cambiare modello non serve mai una vecchia risposta.`,
  'uses.h6':
    'Confronta due prompt in modo onesto',
  'uses.p6':
    `Per sapere se il prompt v2 batte il v1 devi togliere la variazione casuale, altrimenti non distingui un vero miglioramento dalla fortuna. Esegui lo stesso insieme di test con ciascun prompt: senza casualità, ogni differenza nell'output viene dal prompt.`,
  'ui.commands':
    `I comandi`,
  'uses.h7':
    `Usalo dagli strumenti che hai già`,
  'uses.p7':
    `DAOS può girare come server locale che parla l’API chat di OpenAI, quindi a un’app che già usa OpenAI basta cambiare indirizzo. Due avvertenze: lo schema deve porre limiti a ogni campo (valori ammessi, una lunghezza massima, un intervallo per i numeri), e il server risponde solo sulla tua macchina.`,
  'uses.h8':
    `Trova le risposte sbagliate prima dei tuoi utenti`,
  'uses.p8':
    `Una risposta salvata viene ripetuta fedelmente anche quando è sbagliata. Per questo un controllo quotidiano prende le risposte nuove, più una quota a rotazione di quelle vecchie, e chiede a un modello più forte (Claude) e a una ricerca sul web se reggono. Ritira una risposta da solo solo dove le tue regole lo prevedono; tutto il resto finisce in un rapporto che rivedi tu.`,
  'uses.h9':
    `Correggi una risposta salvata senza ricominciare da capo`,
  'uses.p9':
    `Quando una risposta si rivela sbagliata, ritiri quella sola risposta, o la sostituisci con una corretta, e lasci tutto il resto com’è. Finché la correzione non c’è, quella richiesta restituisce un errore chiaro invece della risposta sbagliata. Chi l’ha cambiata, e perché, resta registrato insieme alla modifica.`,
  'limits.h2':
    'Cosa DAOS non fa',
  'limits.intro':
    'La stessa disciplina che crea la garanzia ne traccia anche un confine chiaro.',
  'limits.h3a':
    '<span class="x">×</span> Scrittura creativa o aperta',
  'limits.pa':
    'DAOS costringe le risposte in una forma fissa e le mantiene uguali. Se vuoi varietà, è lo strumento sbagliato.',
  'limits.h3b':
    '<span class="x">×</span> Rendere le risposte corrette',
  'limits.pb':
    `DAOS rende le risposte <em>stabili</em>, non <em>giuste</em>. Una risposta sbagliata viene ripetuta con la stessa fedeltà di una giusta. Il controllo quotidiano e il comando di correzione (§04) ti aiutano a trovarle e correggerle; non le evitano.`,
  'limits.h3c':
    '<span class="x">×</span> Una prima chiamata gratuita',
  'limits.pc':
    'La prima volta il modello deve comunque rispondere, a costo e velocità pieni. Solo le ripetizioni sono istantanee e gratuite.',
  'limits.h3d':
    '<span class="x">×</span> Accorgersi che un modello è cambiato',
  'limits.pd':
    'Rieseguire un run riusa la risposta salvata, quindi un modello che ora risponde in modo diverso viene rieseguito senza problemi. Rilevarlo è previsto, non realizzato.',
  'limits.h3e':
    `<span class="x">×</span> La stessa risposta dopo aver cambiato il modello o il modo in cui gira`,
  'limits.pe':
    `La garanzia vale per un file del modello caricato con le stesse impostazioni. Un altro file o altre impostazioni di caricamento contano come un modello nuovo, quindi DAOS chiede di nuovo, e la nuova risposta può essere diversa. Spostare lo stesso modello su un altro software di esecuzione non è coperto.`,
  'limits.h3f':
    '<span class="x">×</span> Rieseguire chiamate mai registrate',
  'limits.pf':
    'Si possono rieseguire solo i run scritti nel registro firmato. Una chiamata fatta senza registro riceve la risposta salvata ma non lascia nulla da rieseguire.',
  'research.kicker':
    'Ricerca · non nel prodotto',
  'research.h2':
    'Cosa stiamo ancora esplorando',
  'research.intro':
    'Tutto ciò che sta sopra esiste oggi. Questa sezione è diversa: esperimenti e idee di progetto dalla specifica di DAOS che <b>non</b> sono nel prodotto. Sono qui perché hanno dato forma al prodotto, e perché alcuni non hanno funzionato.',
  'research.qh3':
    'Tre copie dello stesso modello possono votare la risposta?',
  'research.qp':
    `Abbiamo fatto girare un modello in tre misure, a precisione piena e compresso a 8 bit e a 4 bit, e le abbiamo fatte votare campo per campo. Dove non erano d'accordo vinceva la maggioranza, così tutte e tre finivano sempre con la stessa risposta finale.`,
  'research.n1':
    'risposta finale da tre copie compresse in modo diverso dello stesso modello, ogni volta',
  'research.n2':
    `dei campi in cui la copia a 4 bit era l'unica in disaccordo; la copia a precisione piena mai`,
  'research.capA':
    'Tre copie votano',
  'research.capB':
    '1 modello · 3 misure',
  'research.leaf':
    'Voto sul campo <b>priority</b>',
  'research.lone':
    `← l'unica in disaccordo`,
  'research.collapse':
    'vince la maggioranza',
  'research.subnote':
    `Il disaccordo della copia a 4 bit viene registrato e il campo è segnato come <b>fragile</b>. Esiste una regola di spareggio (vince la copia più precisa) per quando non c'è maggioranza; qui decide già la maggioranza di due a uno.`,
  'research.foot':
    'Su 40 campi, 31 hanno avuto lo stesso valore da tutte e tre le copie e 9 si sono divisi due a uno, in 6 compiti su 10. Ciò che il voto <em>non</em> ha fatto è rendere le risposte più accurate: su 600 compiti con risposta nota non è andato meglio della sola copia a precisione piena. Le copie tendono a fare gli stessi errori, quindi la maggioranza li ripete. Per questo il voto non è nel prodotto.',
  'research.i1h':
    'Passare a una copia più economica del modello, in sicurezza',
  'research.i1p':
    `Se una copia a 4 bit dà le stesse risposte finali del modello completo, potresti passare a lei per risparmiare, e rieseguire gli input del trimestre scorso per mostrare che non è cambiato nulla. L'esperimento suggerisce che può funzionare. Non è una funzione del prodotto.`,
  'research.i2h':
    `Il disaccordo come spia d'allarme`,
  'research.i2p':
    `Un campo su cui le copie non sono d'accordo è un campo su cui il modello è incerto. Poiché il voto registra chi era in disaccordo, quei campi potrebbero andare a una persona mentre il resto procede senza intoppi.`,
  'brain.kicker':
    'Idee prese in prestito dalle neuroscienze',
  'ui.notBuilt':
    'Nella specifica',
  'brain.h2':
    'Anche i cervelli ricavano un pensiero chiaro da parti rumorose.',
  'brain.lead':
    'I neuroni sono rumorosi e inaffidabili, eppure un cervello si ferma su un solo pensiero. La specifica di DAOS prende in prestito tre trucchi che lo rendono possibile e ne scarta di proposito un quarto. Nessuno è nel prodotto. Uno è stato misurato.',
  'brain.from1':
    '<b>Neuroni che si assestano su uno stato</b> <span class="arrow">→</span> risposte messe in comune',
  'brain.h3a':
    'Lascia che le copie si accordino prima di scegliere ogni parola',
  'brain.p1':
    'Un gruppo di neuroni che riceve un segnale rumoroso cade in un unico schema stabile e ripulisce il rumore lungo la strada. La specifica applica la stessa idea alle copie di un modello: a ogni parola, si combina quanto ogni copia ritiene probabile ciascuna opzione, si sceglie una parola insieme e si va avanti in sincrono.',
  'brain.c1':
    'Non realizzato. Richiede che ogni copia giri dentro un unico programma, parola per parola, cosa che i server di modelli più diffusi non permettono.',
  'brain.from2':
    '<b>Molti neuroni che votano</b> <span class="arrow">→</span> un limite del voto',
  'brain.h3b':
    'Votare aiuta solo se chi vota sbaglia in modi diversi',
  'brain.p2':
    'Sommare molti neuroni cancella il rumore, ma solo se ciascuno fa i propri errori casuali. Se sbagliano insieme, aggiungerne altri non serve. Le copie compresse di uno stesso modello sbagliano insieme, quindi aggiungerne smette presto di servire. La soluzione sono copie fatte in modi davvero diversi.',
  'brain.c2':
    `Misurato: due delle nostre copie sbagliavano insieme quasi sempre (correlazione fino a 0.978). Per questo il voto qui sopra non ha migliorato l'accuratezza.`,
  'brain.from3':
    '<b>Aspettativa</b> <span class="arrow">→</span> una preferenza dichiarata',
  'brain.h3c':
    'Risolvi un quasi-pareggio con una preferenza dichiarata',
  'brain.p3':
    `Di fronte a qualcosa di ambiguo, il cervello propende per ciò che si aspetta. La specifica risolve allo stesso modo un quasi-pareggio tra due parole: lo schema può dire quale valore preferire. Di proposito <em>non</em> usa “quello che abbiamo risposto l'ultima volta in un caso simile”, perché “simile” è vago e riporterebbe dentro la casualità.`,
  'brain.c3':
    'Non realizzato. Senza una preferenza dichiarata, la specifica ripiega su una regola fissa.',
  'brain.from4':
    'Quella che abbiamo scartato: <b>inventarsi una storia</b>',
  'brain.h3d':
    'La parte della mente che inventa un motivo',
  'brain.p4':
    'Gli studi sui pazienti con cervello diviso mostrano la mente che inventa a posteriori una spiegazione convincente, e ci crede. È esattamente ciò che DAOS non deve fare: dare la stessa risposta ogni volta non rende la risposta affidabile.',
  'brain.tagline':
    'Scartata di proposito: un sistema che inventa la propria certezza è il difetto, non la funzione.',
  'brain.foot':
    'Queste idee vengono dalla specifica di DAOS. Mostrano dove il progetto potrebbe andare, non funzioni che puoi attivare oggi.',
  'close.kicker':
    'In breve',
  'close.h2':
    'Se ottenere ogni volta una risposta diversa ti costa, DAOS lo elimina.',
  'close.lead':
    'Test che hanno senso, audit a cui sai rispondere, bug che puoi riprodurre, confronti di cui ti puoi fidare. DAOS restituisce la stessa risposta per la stessa richiesta, con un registro firmato che lo prova.',
  'footer.guarantee':
    'Stessa richiesta, stessa risposta · specifica v1.6',
};

const es: DaosDict = {
  'hero.kicker':
    'La misma pregunta, la misma respuesta',
  'hero.h1':
    'Pregunta una vez.<br>Obtén la <span class="id">misma respuesta</span><br>cada vez después.',
  'hero.lede':
    'Hazle la misma pregunta dos veces a un modelo de IA y puedes recibir dos respuestas distintas. Eso rompe pruebas, auditorías e informes de errores. DAOS consulta al modelo <em>una sola vez</em>, firma la respuesta para que cualquier cambio posterior se detecte, y devuelve exactamente esa respuesta, byte a byte, cada vez que llega la misma petición, sin volver a llamar al modelo.',
  'proof.cap1':
    'Un ticket de soporte',
  'proof.cap2':
    'lo que existe hoy',
  'proof.resolve':
    'La primera vez',
  'proof.cost1':
    '1 llamada al modelo',
  'proof.ticket':
    '“…me han cobrado $49.99 dos veces este mes…”',
  'proof.step':
    'el modelo responde → DAOS ordena la respuesta → la firma y la guarda',
  'proof.reproduce':
    'Cada vez después',
  'proof.cost0':
    '0 llamadas al modelo',
  'proof.when':
    'una ejecución de pruebas · un auditor · un informe de error semanas después',
  'proof.replay':
    '—&nbsp;los mismos bytes&nbsp;—',
  'proof.subnote':
    'No hace falta esperar a que llegue otra vez el mismo ticket: puedes <b>repetir cualquier ejecución registrada</b> y obtener exactamente lo que dijo el modelo en su momento. Repetirla en un proceso nuevo está <b>medido</b>. En una segunda máquina debería cumplirse <b>por diseño</b>, siempre que esa máquina use el mismo archivo de modelo y el mismo software de ejecución.',
  'proof.footK':
    'Medido',
  'proof.footV':
    '20 ejecuciones → 1 respuesta · repetida en un proceso nuevo con 0 llamadas al modelo',
  'hero.fnComment':
    '// misma petición de entrada, misma respuesta de salida: un modelo elegido, consultado una vez y luego repetido',
  'nc.p':
    '<span class="sl-callout__title">¿No es solo una caché?</span>No, y una caché simple sería arriesgada. Si el modelo cambia, una caché sigue sirviendo una respuesta que el modelo ya no daría, y nada te avisa. DAOS ata cada respuesta guardada al modelo exacto que la produjo, así que <b>cambiar de modelo significa que las respuestas antiguas no se usan</b>. Cada respuesta va firmada, así que <b>una respuesta editada se detecta</b>. Y si repetir una ejecución da algo distinto de lo que dice el registro, DAOS lo <b>informa como un error</b>.',
  'why.kicker':
    'Quizá ya lo hayas probado',
  'why.h2':
    '<span class="k">temperature=0</span> hace que un modelo sea menos aleatorio. No lo hace repetible.',
  'why.tag1':
    'Lo que suele probarse',
  'why.h3a':
    'Bajar la aleatoriedad',
  'why.p1':
    `Pon <span class="mono">temperature=0</span> y el modelo siempre elige la palabra siguiente más probable. En nuestras propias pruebas funcionó: 20 ejecuciones seguidas, con cuatro semillas distintas y, en una de ellas, otro trabajo compitiendo por la máquina, dieron <b class="ink">una única respuesta</b>.`,
  'why.note1':
    'Así que con un modelo en una máquina puede funcionar. La mayoría de los equipos se queda ahí y da por hecha una garantía que en realidad no tiene.',
  'why.tag2':
    'Por qué no basta',
  'why.h3b':
    'La aleatoriedad es solo una de las seis cosas que cambian la respuesta',
  'why.p2':
    'El modelo sigue eligiendo su palabra más probable, pero <em>cuál</em> cuenta como la más probable puede cambiar por motivos que nada tienen que ver con la temperatura. Cinco de ellos no los toca <span class="mono">temperature=0</span>:',
  'why.li1':
    'el muestreo aleatorio: el único que una temperatura baja elimina',
  'why.li2':
    'pequeñas diferencias de redondeo en cómo una GPU suma los números',
  'why.li3':
    'el servidor que procesa tu petición junto con las de otras personas',
  'why.li4':
    `una copia más pequeña y comprimida del modelo, que en realidad es un modelo ligeramente distinto <span class="tie">(ver §06)</span>`,
  'why.li5':
    'un modelo alojado que se actualiza sin avisar',
  'why.li6':
    'todo lo demás en un agente: el orden en que se ejecutan las herramientas, las marcas de hora, los resultados de búsqueda',
  'why.punch':
    '<span class="mono">temperature=0</span> vuelve a preguntar al modelo y confía en que la respuesta coincida. Cuando dos palabras son casi igual de probables, puede inclinarse hacia la otra, y nada te avisa. <b>DAOS pregunta una vez, guarda esa respuesta y la devuelve cada vez después, byte a byte, sin llamar al modelo.</b> Usa el mismo ajuste de poca aleatoriedad y añade lo que un ajuste no puede darte: una forma fija para la respuesta, una copia guardada y un registro firmado.',
  'how.h2':
    'Cómo funciona',
  'how.lead':
    'No se puede impedir que un modelo varíe, así que DAOS no lo intenta. Consulta una vez a <b class="ink">un modelo elegido</b> y convierte esa respuesta en la oficial.',
  'how.note1':
    '<b class="ink">1. Pregunta una vez.</b> Envías la entrada junto con un <em>esquema</em>: la forma exacta que debe tener la respuesta, es decir, sus campos, los valores permitidos y la precisión de los números. DAOS consulta al modelo y comprueba la respuesta contra el esquema. Una respuesta que no encaja es un error, nunca se da por buena.',
  'how.note2':
    '<b class="ink">2. Ordénala.</b> Dos respuestas que significan lo mismo deben ser los mismos bytes. Así, un <span class="mono">0.8500000119</span> en bruto pasa a <span class="mono ink-2">0.85</span> (el esquema fija la precisión), el texto se normaliza y los campos se colocan en un orden fijo.',
  'how.note3':
    `<b class="ink">3. Firma, guarda, repite.</b> La respuesta ordenada se firma y se guarda. A partir de ahí, la misma petición recibe la respuesta guardada, sin llamar al modelo. Activa el registro y cada ejecución queda además anotada en un registro firmado, para que puedas repetirla más tarde.`,
  'measured.kicker':
    'Medido, no solo prometido',
  'measured.h2':
    'Probado con un modelo real: Llama-3.2, en un Apple M3 Pro.',
  'measured.label':
    'El producto',
  'measured.n1':
    `ejecuciones seguidas de la misma petición dieron una única respuesta, con cuatro semillas distintas, una con otro trabajo compitiendo por la máquina`,
  'measured.n2':
    'llamadas al modelo para repetir una ejecución registrada, byte a byte, en un proceso nuevo con una clave de firma nueva',
  'uses.h2':
    'Qué puedes hacer con él',
  'ui.realOutput':
    'Salida real',
  'uses.h1':
    'Escribe pruebas con sentido para funciones de IA',
  'uses.p1':
    'No se puede probar contra una respuesta que no deja de cambiar, así que los equipos dejan de escribir pruebas. Con DAOS guardas la respuesta a una entrada conocida como resultado esperado, y la prueba la comprueba en cada build. Cuando alguien cambia el prompt o el modelo, la prueba muestra exactamente qué cambió: una diferencia que revisar, no ruido que ignorar.',
  'uses.h2c':
    'Enseña a un auditor exactamente lo que dijo el modelo',
  'uses.p2':
    `Finanzas, seguros, sanidad: «¿por qué decidió esto y puede mostrarlo otra vez?», a veces años después. Con el registro activado, cada respuesta va a un registro firmado que no se puede editar sin que se detecte, y DAOS repite esa ejecución exacta cuando se le pide.`,
  'uses.h3':
    'Reproduce una mala respuesta que llegó a producción',
  'uses.p3':
    'Cuando una mala respuesta llega a un cliente, lo más difícil es reproducirla, porque las condiciones ya no existen. Un cliente discute una respuesta de hace tres semanas: repites la ejecución registrada y ves los bytes exactos que vio él, no una aproximación. Si la repetición no coincide con el registro, esa diferencia se informa como un error.',
  'uses.h4':
    'Saca datos de documentos con una forma fija',
  'uses.p4':
    'Facturas, contratos, tickets de soporte a JSON. Cada respuesta se comprueba contra el esquema que defines, y la que no encaja falla con el motivo exacto, en lugar de que basura de aspecto plausible llegue al paso siguiente. El mismo documento siempre da la misma fila.',
  'uses.h5':
    'Deja de pagar dos veces por la misma respuesta',
  'uses.p5':
    'La primera petición paga una llamada al modelo. Cada petición posterior que significa lo mismo se sirve desde el almacén: <span class="mono">0.9</span> y <span class="mono">0.90</span>, o los mismos campos en otro orden, cuentan como una sola petición. Como el modelo forma parte de la clave, cambiar de modelo nunca sirve una respuesta antigua.',
  'uses.h6':
    'Compara dos prompts con justicia',
  'uses.p6':
    'Para saber si el prompt v2 supera al v1 hay que quitar la variación aleatoria, o no distinguirás una mejora real de la suerte. Ejecuta el mismo conjunto de pruebas con cada prompt: sin aleatoriedad, cualquier diferencia en la salida viene del prompt.',
  'ui.commands':
    `Los comandos`,
  'uses.h7':
    `Úsalo desde las herramientas que ya tienes`,
  'uses.p7':
    `DAOS puede funcionar como servidor local que habla la API de chat de OpenAI, así que a una app que ya usa OpenAI solo le hace falta una dirección nueva. Dos advertencias: tu esquema tiene que poner límites a cada campo (valores permitidos, una longitud máxima, un rango para los números), y el servidor solo escucha en tu propia máquina.`,
  'uses.h8':
    `Encuentra las respuestas erróneas antes que tus usuarios`,
  'uses.p8':
    `Una respuesta guardada se repite fielmente aunque sea errónea. Por eso un control diario toma las respuestas nuevas, más una parte rotatoria de las antiguas, y pregunta a un modelo más potente (Claude) y a una búsqueda web si se sostienen. Solo retira una respuesta por su cuenta donde tus reglas lo indican; todo lo demás va a un informe para que lo revises.`,
  'uses.h9':
    `Corrige una respuesta guardada sin empezar de cero`,
  'uses.p9':
    `Cuando una respuesta resulta errónea, retiras esa sola respuesta, o la sustituyes por una corregida, y dejas todo lo demás como está. Hasta que haya una corrección, esa petición devuelve un error claro en lugar de la respuesta errónea. Quién la cambió, y por qué, queda registrado junto al cambio.`,
  'limits.h2':
    'Lo que DAOS no hace',
  'limits.intro':
    'La misma disciplina que crea la garantía también le marca un límite claro.',
  'limits.h3a':
    '<span class="x">×</span> Escritura creativa o abierta',
  'limits.pa':
    'DAOS obliga a las respuestas a tener una forma fija y las mantiene iguales. Si quieres variedad, es la herramienta equivocada.',
  'limits.h3b':
    '<span class="x">×</span> Hacer que las respuestas sean correctas',
  'limits.pb':
    `DAOS hace que las respuestas sean <em>estables</em>, no <em>correctas</em>. Una respuesta errónea se repite con la misma fidelidad que una correcta. El control diario y el comando de corrección (§04) te ayudan a encontrarlas y corregirlas; no las evitan.`,
  'limits.h3c':
    '<span class="x">×</span> Una primera llamada gratis',
  'limits.pc':
    'La primera vez, el modelo tiene que responder igualmente, a coste y velocidad completos. Solo las repeticiones son instantáneas y gratuitas.',
  'limits.h3d':
    '<span class="x">×</span> Darse cuenta de que un modelo cambió',
  'limits.pd':
    'Repetir una ejecución reutiliza la respuesta guardada, así que un modelo que ahora responde distinto se repite sin problema. Detectarlo está previsto, no construido.',
  'limits.h3e':
    `<span class="x">×</span> La misma respuesta tras cambiar el modelo o cómo se ejecuta`,
  'limits.pe':
    `La garantía cubre un archivo de modelo cargado con los mismos ajustes. Otro archivo u otros ajustes de carga cuentan como un modelo nuevo, así que DAOS vuelve a preguntar, y la nueva respuesta puede ser distinta. Mover el mismo modelo a otro software de ejecución no está cubierto.`,
  'limits.h3f':
    '<span class="x">×</span> Repetir llamadas que nunca se registraron',
  'limits.pf':
    'Solo se pueden repetir las ejecuciones escritas en el registro firmado. Una llamada hecha sin registro recibe la respuesta guardada, pero no deja nada que repetir.',
  'research.kicker':
    'Investigación · no está en el producto',
  'research.h2':
    'Lo que seguimos explorando',
  'research.intro':
    'Todo lo anterior existe hoy. Esta sección es distinta: experimentos e ideas de diseño de la especificación de DAOS que <b>no</b> están en el producto. Están aquí porque le dieron forma, y porque algunas no funcionaron.',
  'research.qh3':
    '¿Pueden tres copias de un mismo modelo votar la respuesta?',
  'research.qp':
    'Ejecutamos un modelo en tres tamaños, a precisión completa y comprimido a 8 y a 4 bits, y los hicimos votar campo por campo. Donde discrepaban ganaba la mayoría, así que las tres acababan siempre con la misma respuesta final.',
  'research.n1':
    'respuesta final de tres copias comprimidas de distinta forma de un mismo modelo, siempre',
  'research.n2':
    'de los campos en que la copia de 4 bits fue la única en discrepar; la de precisión completa, nunca',
  'research.capA':
    'Tres copias votan',
  'research.capB':
    '1 modelo · 3 tamaños',
  'research.leaf':
    'Votación del campo <b>priority</b>',
  'research.lone':
    '← la única que discrepa',
  'research.collapse':
    'gana la mayoría',
  'research.subnote':
    `La discrepancia de la copia de 4 bits queda registrada y el campo se marca como <b>frágil</b>. Existe una regla de desempate (gana la copia más precisa) para cuando no hay mayoría; aquí ya decide la mayoría de dos a uno.`,
  'research.foot':
    'De 40 campos, 31 recibieron el mismo valor de las tres copias y 9 se dividieron dos contra uno, en 6 de las 10 tareas. Lo que la votación <em>no</em> hizo fue volver las respuestas más precisas: en 600 tareas con respuesta conocida no fue mejor que la copia de precisión completa sola. Las copias tienden a cometer los mismos errores, así que la mayoría los repite. Por eso la votación no está en el producto.',
  'research.i1h':
    'Cambiar a una copia más barata del modelo, con seguridad',
  'research.i1p':
    'Si una copia de 4 bits da las mismas respuestas finales que el modelo completo, podrías cambiarte a ella para ahorrar, y repetir las entradas del trimestre pasado para demostrar que nada cambió. El experimento sugiere que puede funcionar. No es una función del producto.',
  'research.i2h':
    'El desacuerdo como luz de aviso',
  'research.i2p':
    'Un campo en el que las copias discrepan es un campo del que el modelo no está seguro. Como la votación registra quién discrepó, esos campos podrían pasar a una persona mientras el resto sigue sin tocarse.',
  'brain.kicker':
    'Ideas tomadas de la neurociencia',
  'ui.notBuilt':
    'En la especificación',
  'brain.h2':
    'Los cerebros también sacan un pensamiento claro de piezas ruidosas.',
  'brain.lead':
    'Las neuronas son ruidosas y poco fiables, y aun así un cerebro se decide por un solo pensamiento. La especificación de DAOS toma prestados tres trucos que lo hacen posible y rechaza a propósito un cuarto. Ninguno está en el producto. Uno se ha medido.',
  'brain.from1':
    '<b>Neuronas que se asientan en un estado</b> <span class="arrow">→</span> respuestas combinadas',
  'brain.h3a':
    'Deja que las copias se pongan de acuerdo antes de elegir cada palabra',
  'brain.p1':
    'Un grupo de neuronas que recibe una señal ruidosa cae en un único patrón estable y limpia el ruido por el camino. La especificación aplica la misma idea a las copias de un modelo: en cada palabra, se combina lo probable que cada copia considera cada opción, se elige una palabra entre todas y se avanza al unísono.',
  'brain.c1':
    'No construido. Exige que todas las copias se ejecuten dentro de un solo programa, palabra a palabra, algo que los servidores de modelos habituales no permiten.',
  'brain.from2':
    '<b>Muchas neuronas votando</b> <span class="arrow">→</span> un límite de la votación',
  'brain.h3b':
    'Votar solo ayuda si quienes votan se equivocan de formas distintas',
  'brain.p2':
    'Sumar muchas neuronas cancela el ruido, pero solo cuando cada una comete sus propios errores aleatorios. Si fallan a la vez, añadir más no ayuda. Las copias comprimidas de un mismo modelo fallan a la vez, así que añadir más deja de servir enseguida. La solución son copias hechas de formas realmente distintas.',
  'brain.c2':
    'Medido: dos de nuestras copias se equivocaron juntas casi siempre (correlación de hasta 0.978). Por eso la votación de arriba no mejoró la precisión.',
  'brain.from3':
    '<b>Expectativa</b> <span class="arrow">→</span> una preferencia declarada',
  'brain.h3c':
    'Rompe un casi empate con una preferencia declarada',
  'brain.p3':
    'Ante algo ambiguo, el cerebro se inclina hacia lo que espera. La especificación rompe un casi empate entre dos palabras del mismo modo: el esquema puede indicar qué valor preferir. A propósito <em>no</em> usa «lo que respondimos la última vez ante algo parecido», porque «parecido» es difuso y volvería a meter aleatoriedad.',
  'brain.c3':
    'No construido. Sin una preferencia declarada, la especificación recurre a una regla fija.',
  'brain.from4':
    'La que rechazamos: <b>inventarse una historia</b>',
  'brain.h3d':
    'La parte de la mente que inventa una razón',
  'brain.p4':
    'Los estudios con pacientes de cerebro dividido muestran a la mente inventando a posteriori una explicación convincente, y creyéndosela. Eso es exactamente lo que DAOS no debe hacer: dar la misma respuesta siempre no hace que la respuesta sea digna de confianza.',
  'brain.tagline':
    'Rechazada a propósito: un sistema que inventa su propia certeza es el fallo, no la función.',
  'brain.foot':
    'Estas ideas vienen de la especificación de DAOS. Muestran hacia dónde podría ir el diseño, no funciones que puedas activar hoy.',
  'close.kicker':
    'En resumen',
  'close.h2':
    'Si recibir una respuesta distinta cada vez te está costando caro, DAOS lo elimina.',
  'close.lead':
    'Pruebas con sentido, auditorías a las que puedes responder, errores que puedes reproducir, comparaciones en las que puedes confiar. DAOS devuelve la misma respuesta para la misma petición, con un registro firmado que lo prueba.',
  'footer.guarantee':
    'Misma petición, misma respuesta · especificación v1.6',
};

const de: DaosDict = {
  'hero.kicker':
    'Gleiche Frage, gleiche Antwort',
  'hero.h1':
    'Frag einmal.<br>Bekomm danach jedes Mal<br>die <span class="id">gleiche Antwort</span>.',
  'hero.lede':
    'Stell einem KI-Modell zweimal dieselbe Frage, und du kannst zwei verschiedene Antworten bekommen. Das bringt Tests, Prüfungen und Fehlerberichte durcheinander. DAOS fragt das Modell <em>ein einziges Mal</em>, signiert die Antwort, damit jede spätere Änderung auffällt, und liefert genau diese Antwort, Byte für Byte, immer wieder, wenn dieselbe Anfrage eintrifft, ohne das Modell erneut aufzurufen.',
  'proof.cap1':
    'Ein Support-Ticket',
  'proof.cap2':
    'was heute schon läuft',
  'proof.resolve':
    'Beim ersten Mal',
  'proof.cost1':
    '1 Modellaufruf',
  'proof.ticket':
    '„…diesen Monat zweimal $49.99 abgebucht…“',
  'proof.step':
    'das Modell antwortet → DAOS bringt die Antwort in Form → signiert sie und speichert sie',
  'proof.reproduce':
    'Jedes Mal danach',
  'proof.cost0':
    '0 Modellaufrufe',
  'proof.when':
    'ein Testlauf · ein Prüfer · ein Fehlerbericht Wochen später',
  'proof.replay':
    '—&nbsp;dieselben Bytes&nbsp;—',
  'proof.subnote':
    'Du musst nicht warten, bis dasselbe Ticket wieder kommt: Du kannst <b>jeden protokollierten Lauf wiederholen</b> und bekommst genau das zurück, was das Modell damals gesagt hat. Die Wiederholung in einem frischen Prozess ist <b>gemessen</b>. Auf einem zweiten Rechner sollte sie <b>laut Entwurf</b> halten, solange dieser Rechner dieselbe Modelldatei mit derselben Software ausführt.',
  'proof.footK':
    'Gemessen',
  'proof.footV':
    '20 Läufe → 1 Antwort · in einem frischen Prozess wiederholt, mit 0 Modellaufrufen',
  'hero.fnComment':
    '// gleiche Anfrage rein, gleiche Antwort raus: ein gewähltes Modell, einmal gefragt, dann wiederholt',
  'nc.p':
    '<span class="sl-callout__title">Ist das nicht einfach ein Cache?</span>Nein, und ein einfacher Cache wäre riskant. Ändert sich das Modell, liefert ein Cache weiter eine Antwort, die das Modell so nicht mehr geben würde, und nichts warnt dich. DAOS bindet jede gespeicherte Antwort an das genaue Modell, das sie erzeugt hat, also <b>werden beim Wechsel des Modells die alten Antworten nicht benutzt</b>. Jede Antwort ist signiert, also <b>fällt eine veränderte Antwort auf</b>. Und wenn die Wiederholung eines Laufs etwas anderes ergibt als das Protokoll, <b>meldet DAOS das als Fehler</b>.',
  'why.kicker':
    'Vielleicht hast du das schon versucht',
  'why.h2':
    '<span class="k">temperature=0</span> macht ein Modell weniger zufällig. Es macht es nicht wiederholbar.',
  'why.tag1':
    'Was Leute versuchen',
  'why.h3a':
    'Den Zufall herunterdrehen',
  'why.p1':
    `Setz <span class="mono">temperature=0</span>, und das Modell wählt immer das wahrscheinlichste nächste Wort. In unseren eigenen Tests hat das gehalten: 20 Läufe hintereinander, mit vier verschiedenen Seeds und bei einem davon mit einem zweiten Auftrag auf demselben Rechner, ergaben <b class="ink">eine einzige Antwort</b>.`,
  'why.note1':
    'Mit einem Modell auf einem Rechner kann es also funktionieren. Die meisten Teams hören hier auf und glauben an eine Garantie, die sie in Wahrheit nicht haben.',
  'why.tag2':
    'Warum das nicht reicht',
  'why.h3b':
    'Zufall ist nur eines von sechs Dingen, die die Antwort verändern',
  'why.p2':
    'Das Modell wählt zwar weiter sein wahrscheinlichstes Wort, aber <em>welches</em> Wort als das wahrscheinlichste gilt, kann sich aus Gründen verschieben, die mit der Temperatur nichts zu tun haben. Fünf davon lässt <span class="mono">temperature=0</span> unberührt:',
  'why.li1':
    'zufällige Auswahl: das Einzige, was eine niedrige Temperatur beseitigt',
  'why.li2':
    'winzige Rundungsunterschiede, wie eine GPU Zahlen addiert',
  'why.li3':
    'der Server, der deine Anfrage zusammen mit denen anderer Leute bearbeitet',
  'why.li4':
    `eine kleinere, komprimierte Kopie des Modells, die in Wahrheit ein etwas anderes Modell ist <span class="tie">(siehe §06)</span>`,
  'why.li5':
    'ein gehostetes Modell, das ohne Vorankündigung aktualisiert wird',
  'why.li6':
    'alles andere in einem Agenten: die Reihenfolge, in der Werkzeuge laufen, Zeitstempel, Suchergebnisse',
  'why.punch':
    '<span class="mono">temperature=0</span> fragt das Modell noch einmal und hofft, dass die Antwort gleich ausfällt. Sind zwei Wörter fast gleich wahrscheinlich, kann es in die andere Richtung kippen, und nichts warnt dich. <b>DAOS fragt einmal, behält diese Antwort und liefert sie danach jedes Mal Byte für Byte zurück, ohne Modellaufruf.</b> Es nutzt dieselbe Einstellung für wenig Zufall und ergänzt, was eine Einstellung nicht leisten kann: eine feste Form für die Antwort, eine gespeicherte Kopie und ein signiertes Protokoll.',
  'how.h2':
    'So funktioniert es',
  'how.lead':
    'Man kann ein Modell nicht davon abhalten zu schwanken, also versucht DAOS es gar nicht erst. Es fragt <b class="ink">ein gewähltes Modell</b> einmal und macht diese Antwort zur offiziellen.',
  'how.note1':
    '<b class="ink">1. Einmal fragen.</b> Du schickst die Eingabe zusammen mit einem <em>Schema</em>: der genauen Form, die die Antwort haben muss, also Felder, erlaubte Werte und Genauigkeit der Zahlen. DAOS fragt das Modell und prüft die Antwort gegen das Schema. Eine Antwort, die nicht passt, ist ein Fehler und wird nie weitergereicht, als wäre alles in Ordnung.',
  'how.note2':
    '<b class="ink">2. In Form bringen.</b> Zwei Antworten, die dasselbe bedeuten, sollen dieselben Bytes sein. Aus einem rohen <span class="mono">0.8500000119</span> wird also <span class="mono ink-2">0.85</span> (das Schema legt die Genauigkeit fest), Text wird vereinheitlicht und Felder kommen in eine feste Reihenfolge.',
  'how.note3':
    `<b class="ink">3. Signieren, speichern, wiederholen.</b> Die bereinigte Antwort wird signiert und gespeichert. Ab da bekommt dieselbe Anfrage die gespeicherte Antwort, ohne das Modell aufzurufen. Schalte das Protokoll ein, und jeder Lauf wird zusätzlich signiert protokolliert, sodass du ihn später wiederholen kannst.`,
  'measured.kicker':
    'Gemessen, nicht nur versprochen',
  'measured.h2':
    'Getestet an einem echten Modell: Llama-3.2, auf einem Apple M3 Pro.',
  'measured.label':
    'Das Produkt',
  'measured.n1':
    `Läufe in Folge mit derselben Anfrage ergaben eine einzige Antwort, mit vier Seeds, einer davon mit einem zweiten Auftrag auf dem Rechner`,
  'measured.n2':
    'Modellaufrufe, um einen protokollierten Lauf Byte für Byte zu wiederholen, in einem frischen Prozess mit neuem Signaturschlüssel',
  'uses.h2':
    'Was du damit machen kannst',
  'ui.realOutput':
    'Echte Ausgabe',
  'uses.h1':
    'Schreib Tests für KI-Funktionen, die etwas aussagen',
  'uses.p1':
    'Gegen eine Antwort, die sich ständig ändert, kann man nicht testen, also hören Teams auf, Tests zu schreiben. Mit DAOS speicherst du die Antwort auf eine bekannte Eingabe als erwartetes Ergebnis, und der Test prüft sie bei jedem Build. Ändert jemand den Prompt oder das Modell, zeigt der Test genau, was sich geändert hat: ein Unterschied zum Prüfen, kein Rauschen zum Ignorieren.',
  'uses.h2c':
    'Zeig einem Prüfer genau, was das Modell gesagt hat',
  'uses.p2':
    `Finanzen, Versicherung, Gesundheit: „Warum wurde so entschieden, und kannst du es noch einmal zeigen?“, manchmal Jahre später. Mit eingeschaltetem Protokoll landet jede Antwort in einem signierten Protokoll, das sich nicht ändern lässt, ohne dass es auffällt, und DAOS wiederholt auf Wunsch genau diesen Lauf.`,
  'uses.h3':
    'Eine schlechte Antwort aus der Produktion nachstellen',
  'uses.p3':
    'Wenn eine schlechte Antwort einen Kunden erreicht, ist das Nachstellen der schwerste Schritt, weil die Bedingungen weg sind. Ein Kunde bestreitet eine Antwort von vor drei Wochen: Du wiederholst den protokollierten Lauf und siehst genau die Bytes, die er gesehen hat, keine Annäherung. Passt die Wiederholung nicht zum Protokoll, wird dieser Unterschied als Fehler gemeldet.',
  'uses.h4':
    'Daten aus Dokumenten in eine feste Form bringen',
  'uses.p4':
    'Rechnungen, Verträge, Support-Tickets als JSON. Jede Antwort wird gegen das Schema geprüft, das du festlegst, und eine, die nicht passt, scheitert mit dem genauen Grund, statt dass plausibel aussehender Unsinn im nächsten Schritt ankommt. Dasselbe Dokument ergibt immer dieselbe Zeile.',
  'uses.h5':
    'Nicht mehr zweimal für dieselbe Antwort zahlen',
  'uses.p5':
    'Die erste Anfrage bezahlt einen Modellaufruf. Jede spätere Anfrage, die dasselbe bedeutet, kommt aus dem Speicher: <span class="mono">0.9</span> und <span class="mono">0.90</span> oder dieselben Felder in anderer Reihenfolge zählen als eine Anfrage. Weil das Modell Teil des Schlüssels ist, wird beim Modellwechsel nie eine alte Antwort geliefert.',
  'uses.h6':
    'Zwei Prompts fair vergleichen',
  'uses.p6':
    'Um zu wissen, ob Prompt v2 besser ist als v1, musst du die zufällige Schwankung entfernen, sonst kannst du eine echte Verbesserung nicht von Glück unterscheiden. Lass dieselben Tests mit jedem Prompt laufen: Ohne Zufall kommt jeder Unterschied in der Ausgabe vom Prompt.',
  'ui.commands':
    `Die Befehle`,
  'uses.h7':
    `Nutze es aus den Tools, die du schon hast`,
  'uses.p7':
    `DAOS kann als lokaler Server laufen, der die Chat-API von OpenAI spricht. Eine App, die schon mit OpenAI redet, braucht also nur eine neue Adresse. Zwei Haken: Dein Schema muss jedes Feld begrenzen (erlaubte Werte, eine maximale Länge, einen Bereich für Zahlen), und der Server hört nur auf deinem eigenen Rechner.`,
  'uses.h8':
    `Finde falsche Antworten, bevor deine Nutzer es tun`,
  'uses.p8':
    `Eine gespeicherte Antwort wird treu wiederholt, auch wenn sie falsch ist. Deshalb nimmt eine tägliche Prüfung die neuen Antworten plus einen wechselnden Teil der älteren und fragt ein stärkeres Modell (Claude) und eine Websuche, ob sie standhalten. Von sich aus zieht sie eine Antwort nur zurück, wo deine Regeln es sagen; alles andere landet in einem Bericht, den du durchsiehst.`,
  'uses.h9':
    `Korrigiere eine gespeicherte Antwort, ohne neu anzufangen`,
  'uses.p9':
    `Stellt sich eine Antwort als falsch heraus, ziehst du genau diese eine Antwort zurück oder ersetzt sie durch eine korrigierte, und alles andere bleibt, wie es ist. Bis eine Korrektur da ist, liefert diese Anfrage einen klaren Fehler statt der falschen Antwort. Wer sie geändert hat und warum, wird mit der Änderung festgehalten.`,
  'limits.h2':
    'Was DAOS nicht tut',
  'limits.intro':
    'Dieselbe Strenge, die die Garantie möglich macht, zieht auch eine klare Grenze um sie.',
  'limits.h3a':
    '<span class="x">×</span> Kreatives oder offenes Schreiben',
  'limits.pa':
    'DAOS zwingt Antworten in eine feste Form und hält sie gleich. Wenn du Abwechslung willst, ist es das falsche Werkzeug.',
  'limits.h3b':
    '<span class="x">×</span> Antworten richtig machen',
  'limits.pb':
    `DAOS macht Antworten <em>stabil</em>, nicht <em>richtig</em>. Eine falsche Antwort wird genauso treu wiederholt wie eine richtige. Die tägliche Prüfung und der Korrekturbefehl (§04) helfen dir, falsche Antworten zu finden und zu korrigieren; verhindern können sie sie nicht.`,
  'limits.h3c':
    '<span class="x">×</span> Ein kostenloser erster Aufruf',
  'limits.pc':
    'Beim ersten Mal muss das Modell trotzdem antworten, zu vollen Kosten und in voller Zeit. Nur die Wiederholungen sind sofort da und kostenlos.',
  'limits.h3d':
    '<span class="x">×</span> Bemerken, dass sich ein Modell geändert hat',
  'limits.pd':
    'Eine Wiederholung nutzt die gespeicherte Antwort, also läuft sie auch dann sauber, wenn das Modell inzwischen anders antwortet. Das zu erkennen ist geplant, nicht gebaut.',
  'limits.h3e':
    `<span class="x">×</span> Dieselbe Antwort nach einem Wechsel von Modell oder Laufzeitumgebung`,
  'limits.pe':
    `Die Garantie gilt für eine Modelldatei, die mit denselben Einstellungen geladen wird. Eine andere Datei oder andere Ladeeinstellungen zählen als neues Modell, also fragt DAOS neu, und die neue Antwort kann abweichen. Dasselbe Modell auf einer anderen Laufzeit-Software ist gar nicht abgedeckt.`,
  'limits.h3f':
    '<span class="x">×</span> Aufrufe wiederholen, die nie protokolliert wurden',
  'limits.pf':
    'Nur Läufe, die ins signierte Protokoll geschrieben wurden, lassen sich wiederholen. Ein Aufruf ohne Protokoll bekommt die gespeicherte Antwort, hinterlässt aber nichts zum Wiederholen.',
  'research.kicker':
    'Forschung · nicht im Produkt',
  'research.h2':
    'Was wir noch erkunden',
  'research.intro':
    'Alles oben gibt es heute. Dieser Abschnitt ist anders: Experimente und Entwurfsideen aus der DAOS-Spezifikation, die <b>nicht</b> im Produkt sind. Sie stehen hier, weil sie es geprägt haben und weil manche nicht aufgegangen sind.',
  'research.qh3':
    'Können drei Kopien eines Modells über die Antwort abstimmen?',
  'research.qp':
    'Wir haben ein Modell in drei Größen laufen lassen, in voller Genauigkeit und auf 8 Bit und 4 Bit komprimiert, und sie Feld für Feld abstimmen lassen. Wo sie uneins waren, gewann die Mehrheit, sodass alle drei am Ende immer dieselbe Antwort hatten.',
  'research.n1':
    'Endantwort aus drei unterschiedlich komprimierten Kopien eines Modells, jedes Mal',
  'research.n2':
    'der Felder, in denen nur die 4-Bit-Kopie abwich; die Kopie in voller Genauigkeit nie',
  'research.capA':
    'Drei Kopien stimmen ab',
  'research.capB':
    '1 Modell · 3 Größen',
  'research.leaf':
    'Abstimmung über das Feld <b>priority</b>',
  'research.lone':
    '← die einzige, die abweicht',
  'research.collapse':
    'die Mehrheit gewinnt',
  'research.subnote':
    `Die Abweichung der 4-Bit-Kopie wird festgehalten und das Feld als <b>fragil</b> markiert. Gibt es keine Mehrheit, entscheidet eine feste Regel: Die genaueste Kopie gewinnt. Hier entscheidet schon die Zwei-zu-eins-Mehrheit.`,
  'research.foot':
    'Von 40 Feldern bekamen 31 von allen drei Kopien denselben Wert und 9 teilten sich zwei zu eins, verteilt auf 6 der 10 Aufgaben. Was die Abstimmung <em>nicht</em> geschafft hat: Antworten genauer zu machen. Bei 600 Aufgaben mit bekannter Lösung war sie nicht besser als die Kopie in voller Genauigkeit allein. Die Kopien machen tendenziell dieselben Fehler, also wiederholt die Mehrheit sie nur. Deshalb ist das Abstimmen nicht im Produkt.',
  'research.i1h':
    'Sicher auf eine günstigere Kopie des Modells wechseln',
  'research.i1p':
    'Wenn eine 4-Bit-Kopie dieselben Endantworten liefert wie das volle Modell, könntest du zum Sparen auf sie wechseln und die Eingaben des letzten Quartals wiederholen, um zu zeigen, dass sich nichts geändert hat. Das Experiment deutet an, dass das klappen kann. Es ist keine Produktfunktion.',
  'research.i2h':
    'Uneinigkeit als Warnlicht',
  'research.i2p':
    'Ein Feld, bei dem die Kopien uneins sind, ist ein Feld, bei dem sich das Modell unsicher ist. Weil die Abstimmung festhält, wer abwich, könnten diese Felder an einen Menschen gehen, während der Rest unangetastet durchläuft.',
  'brain.kicker':
    'Ideen aus der Neurowissenschaft',
  'ui.notBuilt':
    'In der Spezifikation',
  'brain.h2':
    'Auch Gehirne gewinnen aus unruhigen Teilen einen klaren Gedanken.',
  'brain.lead':
    'Neuronen sind unruhig und unzuverlässig, und trotzdem legt sich ein Gehirn auf einen Gedanken fest. Die DAOS-Spezifikation leiht sich drei Kniffe, die das möglich machen, und lehnt einen vierten bewusst ab. Keiner davon ist im Produkt. Einer wurde gemessen.',
  'brain.from1':
    '<b>Neuronen, die sich auf einen Zustand einpendeln</b> <span class="arrow">→</span> gebündelte Antworten',
  'brain.h3a':
    'Die Kopien sich einigen lassen, bevor jedes Wort gewählt wird',
  'brain.p1':
    'Eine Gruppe von Neuronen, die ein verrauschtes Signal bekommt, fällt in ein einziges stabiles Muster und räumt dabei das Rauschen weg. Die Spezifikation überträgt das auf Kopien eines Modells: Bei jedem Wort wird zusammengerechnet, wie wahrscheinlich jede Kopie jede Option findet, gemeinsam ein Wort gewählt und im Gleichschritt weitergemacht.',
  'brain.c1':
    'Nicht gebaut. Dafür müssten alle Kopien Wort für Wort in einem Programm laufen, was gängige Modellserver nicht erlauben.',
  'brain.from2':
    '<b>Viele Neuronen stimmen ab</b> <span class="arrow">→</span> eine Grenze der Abstimmung',
  'brain.h3b':
    'Abstimmen hilft nur, wenn die Abstimmenden unterschiedliche Fehler machen',
  'brain.p2':
    'Viele Neuronen zusammenzuzählen hebt das Rauschen auf, aber nur, wenn jedes seine eigenen zufälligen Fehler macht. Liegen sie gemeinsam daneben, hilft mehr davon nicht. Komprimierte Kopien eines Modells liegen gemeinsam daneben, also hilft es schnell nicht mehr, weitere hinzuzunehmen. Die Lösung sind Kopien, die auf wirklich verschiedene Weise entstanden sind.',
  'brain.c2':
    'Gemessen: Zwei unserer Kopien lagen fast immer gemeinsam falsch (Korrelation bis 0.978). Deshalb hat die Abstimmung oben die Genauigkeit nicht verbessert.',
  'brain.from3':
    '<b>Erwartung</b> <span class="arrow">→</span> eine erklärte Vorliebe',
  'brain.h3c':
    'Ein knappes Patt mit einer erklärten Vorliebe auflösen',
  'brain.p3':
    'Vor etwas Mehrdeutigem neigt das Gehirn zu dem, was es erwartet. Die Spezifikation löst ein knappes Patt zwischen zwei Wörtern genauso: Das Schema kann sagen, welcher Wert bevorzugt wird. Sie nutzt bewusst <em>nicht</em> „was wir beim letzten ähnlichen Fall geantwortet haben“, denn „ähnlich“ ist unscharf und würde den Zufall zurückbringen.',
  'brain.c3':
    'Nicht gebaut. Ohne erklärte Vorliebe greift die Spezifikation auf eine feste Regel zurück.',
  'brain.from4':
    'Die, die wir verworfen haben: <b>sich eine Geschichte ausdenken</b>',
  'brain.h3d':
    'Der Teil des Geistes, der sich einen Grund ausdenkt',
  'brain.p4':
    'Studien an Split-Brain-Patienten zeigen, wie der Geist nachträglich eine überzeugende Erklärung erfindet und ihr glaubt. Genau das darf DAOS nicht tun: Jedes Mal dieselbe Antwort zu geben macht die Antwort nicht vertrauenswürdig.',
  'brain.tagline':
    'Mit Absicht verworfen: Ein System, das sich seine eigene Sicherheit ausdenkt, ist der Fehler, nicht die Funktion.',
  'brain.foot':
    'Diese Ideen stammen aus der DAOS-Spezifikation. Sie zeigen, wohin der Entwurf gehen könnte, nicht Funktionen, die du heute einschalten kannst.',
  'close.kicker':
    'Kurz gesagt',
  'close.h2':
    'Wenn dich jedes Mal eine andere Antwort Geld kostet, nimmt DAOS dir das ab.',
  'close.lead':
    'Tests, die etwas aussagen, Prüfungen, auf die du antworten kannst, Fehler, die du nachstellen kannst, Vergleiche, denen du trauen kannst. DAOS liefert für dieselbe Anfrage dieselbe Antwort, mit einem signierten Protokoll als Beweis.',
  'footer.guarantee':
    'Gleiche Anfrage, gleiche Antwort · Spezifikation v1.6',
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
