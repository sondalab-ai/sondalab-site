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
    'A research note · DAOS',
  'hero.h1':
    'Asking <span class="id">twice</span>',
  'hero.sub':
    'What it takes to get the same answer from an AI model.',
  'hero.lede':
    'We built DAOS to make an AI model give the same answer every time. It works, within narrow limits. This is what we measured, what did not pay off, and when you do not need any of it.',
  'glance.cap':
    'At a glance',
  'glance.n1':
    'runs of one request at <span class="mono">temperature=0</span>, on one machine: one single answer',
  'glance.n2':
    'model calls to replay a logged run, byte for byte',
  'glance.n3':
    'accuracy of three model copies voting, against the best copy alone (33.7%)',
  'glance.n4':
    'how closely the copies’ mistakes matched (1 means always together)',
  'p.kicker':
    'The problem',
  'p.h2':
    'Same question, different answers',
  'p.p1':
    'Ask an AI model the same question twice and you may get two different answers, even with the randomness turned off (<span class="mono">temperature=0</span>). When Thinking Machines asked one large model the same question 1,000 times at temperature 0, they got 80 different answers. All of them began with the same 102 tokens (pieces of words) and then went their own way <span class="ref">[1]</span>.',
  'p.p2':
    'A study of AI models used as graders found the same thing with GPT-4o, Gemini and Claude: identical inputs, different scores, even at temperature 0 <span class="ref">[2]</span>.',
  'p.why':
    'Why it happens, even with the randomness off:',
  'p.li1':
    'a busy server processes your request together with other people’s, and the size of that batch changes the arithmetic (the main cause found in <span class="ref">[1]</span>)',
  'p.li2':
    'a GPU adds numbers in a different order, and tiny rounding differences add up',
  'p.li3':
    'a smaller, compressed copy of a model is really a slightly different model',
  'p.li4':
    'a hosted model can be updated without notice',
  'p.note':
    'Why it matters: if an answer can change, you cannot prove what the model said, you cannot compare two prompts fairly, and a wrong answer can come and go.',
  'f.kicker':
    'First finding',
  'f.h2':
    'On one machine, turning the randomness off was enough',
  'f.lead':
    'Before building anything, we measured. A small open model (Llama-3.2, 1 billion parameters) on one laptop chip (Apple M3 Pro), served by LM Studio:',
  'f.n1':
    'runs of the same request, with four different seeds: one single answer',
  'f.n2':
    'runs with another request in flight at the same time: identical to the quiet runs',
  'f.note':
    'So on your own machine, with one model, <span class="mono">temperature=0</span> and a plain cache may be all you need. The 80 answers in <span class="ref">[1]</span> came from a large shared server, which is where most people are when they use a hosted model. Our own concurrency test only overlapped requests on the wire; it did not reproduce a busy server’s batching.',
  'b.kicker':
    'What we built anyway',
  'b.h2':
    'Stable is not the same as provable',
  'b.lead':
    'A stable answer is still just a claim. We wanted three more things: proof of what the model said, a way to replay it, and a way to fix one wrong answer without touching the rest. That is DAOS, a Python library:',
  'b.s1':
    '<b class="ink">1. Ask once.</b> You send the input with a <em>schema</em>, the exact shape the answer must have: fields, allowed values, number precision. An answer that does not fit is an error, never passed on.',
  'b.s2':
    '<b class="ink">2. Tidy.</b> Two answers that mean the same thing should be the same bytes: a raw <span class="mono">0.8500000119</span> becomes <span class="mono ink-2">0.85</span>, text is normalised, fields are put in a fixed order.',
  'b.s3':
    '<b class="ink">3. Sign and store.</b> The answer is signed, so an edit is caught, and stored under a key that includes the exact model file and its settings. Swap the model and the old answers are not used.',
  'b.s4':
    '<b class="ink">4. Replay.</b> With the log turned on, every run is recorded in a signed log. A logged run replayed in a fresh process, with a new signing key, gave back the same bytes with zero model calls.',
  'b.tag':
    'Real output',
  'r.kicker':
    'The rule that limits everything',
  'r.h2':
    'The input has to be exactly the same',
  'r.p1':
    'DAOS recognises a request only if it is the same byte for byte, after evening out the order of fields, the unicode form and the number format. A different capital letter, an extra space or a typo inside the text is a new request: a new model call, and possibly a different answer.',
  'r.p2':
    'We could match “similar” requests instead. We chose not to: deciding what counts as similar is itself a judgement that can change, and it would bring the randomness back through the side door.',
  'r.p3':
    'So DAOS fits <b class="ink">records you already hold and process again</b>, such as a stored document, a ticket in your database or an eval set. It does not fit things people type.',
  'r.tag':
    'Example',
  'v.kicker':
    'The experiment that did not pay off',
  'v.h2':
    'Three copies of one model, voting',
  'v.lead':
    'Could several copies of a model vote their way to an answer that is both stable and better? We ran the same model at full precision and compressed to 8-bit and 4-bit, and had them vote on each field of the answer.',
  'v.capA':
    'Three copies vote',
  'v.capB':
    '1 model · 3 sizes',
  'v.leaf':
    'Voting on the <b>priority</b> field',
  'v.lone':
    '← the only one to disagree',
  'v.collapse':
    'the majority wins',
  'v.subnote':
    'Over 40 fields, the full-precision copy was never the only one to disagree; the 8-bit copy was, 2 times; the 4-bit copy, 7 times.',
  'v.n1':
    'fields where the copies split two to one; the majority still gave one consistent answer',
  'v.n2':
    'labelled tasks used to check accuracy: sorting customer requests into 150 intents',
  'v.result':
    'Consistent, yes. Better, no. On the 600 tasks the vote scored 33.2%; the full-precision copy alone scored 33.7%. The gap is too small to call either way, but there is no gain. The reason: compressed copies of one model make the same mistakes. Two copies that were both wrong gave the same wrong answer 91–99% of the time, and 380 of the 600 tasks were wrong on all three. A majority of voters who fail together just repeats the failure.',
  'v.lesson':
    '<b>Consistent is not correct.</b> Voting only helps when the voters make different mistakes. That is why the vote stayed a research mode and never became part of the library’s main path.',
  'brain.kicker':
    'Ideas borrowed from neuroscience',
  'ui.notBuilt':
    'In the spec',
  'brain.h2':
    'Brains also get one clear thought out of noisy parts',
  'brain.lead':
    'Neurons are noisy and unreliable, yet a brain settles on one thought. The DAOS spec borrows three tricks that make that possible, and deliberately rejects a fourth. None of them is built. One limit has been measured.',
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
    'Adding up many neurons cancels noise, but only when each one makes its own random errors. If they go wrong together, adding more does not help. Compressed copies of one model go wrong together, so adding more of them stops helping quickly.',
  'brain.c2':
    'Measured: the copies were wrong together almost every time (correlation up to 0.978). This is why the vote did not improve accuracy.',
  'brain.from3':
    '<b>Expectation</b> <span class="arrow">→</span> a stated preference',
  'brain.h3c':
    'Break a near-tie with a stated preference',
  'brain.p3':
    'Faced with something ambiguous, the brain leans toward what it expects. The spec breaks a near-tie between two words the same way: the schema can say which value to prefer. It deliberately does <em>not</em> use “whatever we answered last time for something similar”, for the same reason as the exact-input rule.',
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
  'w.kicker':
    'Wrong answers repeat faithfully',
  'w.h2':
    'So we added a check and a fix',
  'w.lead':
    'A stored answer is repeated just as faithfully when it is wrong. Two tools deal with that.',
  'w.h3a':
    'A daily check',
  'w.pa':
    'Once a day it takes the new answers, plus a rotating share of older ones, and asks a stronger model (Claude) and a web search whether they hold up. It withdraws an answer on its own only where your rules say so; everything else goes into a report for a person to review. The check is paid, and capped by a budget you set.',
  'w.h3b':
    'Correcting one answer',
  'w.pb':
    'A wrong answer can be withdrawn, or replaced with a fixed one, without touching anything else. Until a fix is in place, that request returns a clear error instead of the wrong answer. Who changed it, and why, is recorded with the change.',
  'w.tag':
    'The commands',
  'u.kicker':
    'When you need this',
  'u.h2':
    'When it is worth it, and when it is not',
  'u.yes':
    'Worth it',
  'u.y1':
    'You process the same records again and again (documents, tickets, a catalogue) and must be able to prove or correct any single answer.',
  'u.y2':
    'You use an AI model as a grader, and a score must only move when the answer or the grader changes.',
  'u.y3':
    'Someone may ask, months later, exactly what the model decided, and whether it was changed since.',
  'u.no':
    'Not worth it',
  'u.n1':
    'Chat, or anything people type: the wording is never exactly the same twice.',
  'u.n2':
    'One model on your own machine, where <span class="mono">temperature=0</span> and a plain cache already give one answer.',
  'u.n3':
    'You want better answers: DAOS makes them stable, not right.',
  'u.n4':
    'You use a hosted model: today DAOS only drives local models, through LM Studio.',
  'o.kicker':
    'Open questions',
  'o.h2':
    'What we have not answered',
  'o.h3a':
    'Copies built differently',
  'o.pa':
    'Would copies compressed with different methods (MLX, GPTQ, AWQ) make different mistakes, and make voting worth it? Not measured yet.',
  'o.h3b':
    'Noticing that a model changed',
  'o.pb':
    'Replay reuses the stored answer, so a model that now answers differently still replays fine. Detecting that drift is designed, not built.',
  'o.h3c':
    'The same answer on other software',
  'o.pc':
    'DAOS promises the same answer for one model file with the same settings. Moving to other inference software is not covered; batch-invariant GPU code <span class="ref">[1]</span> might change that.',
  'o.h3d':
    'Acting on near-ties',
  'o.pd':
    'In research mode DAOS can measure when the model almost picked a different word. Doing something about it, such as sending the answer for review, is not built.',
  'close.kicker':
    'What we take away',
  'close.h2':
    'Stable is cheap. Provable is the hard part. Correct is a different problem.',
  'close.lead':
    'On one machine, turning the randomness off already gives one answer. What DAOS adds is proof, replay and per-answer correction, and only for inputs that come back exactly the same. No amount of agreement makes a wrong answer right.',
  's.kicker':
    'Setup and sources',
  's.setup':
    'Measured in July 2026 with Llama-3.2-1B-Instruct in three sizes (F16, Q8_0, Q4_K_M), in LM Studio on an Apple M3 Pro. Accuracy: 600 tasks from the CLINC150 set. Design: DAOS specification v1.6. The source repository is private.',
  'footer.guarantee':
    'A research note · spec v1.6',
};

export type DaosKey = keyof typeof en;
export type DaosDict = Record<DaosKey, string>;

const it: DaosDict = {
  'hero.kicker':
    `Una nota di ricerca · DAOS`,
  'hero.h1':
    `Chiedere <span class="id">due volte</span>`,
  'hero.sub':
    `Cosa serve per ottenere la stessa risposta da un modello di IA.`,
  'hero.lede':
    `Abbiamo costruito DAOS per far dare a un modello di IA sempre la stessa risposta. Funziona, entro limiti stretti. Qui trovi cosa abbiamo misurato, cosa non ha dato frutti e quando non ti serve niente di tutto questo.`,
  'glance.cap':
    `In breve`,
  'glance.n1':
    `esecuzioni della stessa richiesta con <span class="mono">temperature=0</span>, su una sola macchina: una sola risposta`,
  'glance.n2':
    `chiamate al modello per rieseguire un’esecuzione registrata, byte per byte`,
  'glance.n3':
    `accuratezza di tre copie del modello che votano, contro la migliore copia da sola (33.7%)`,
  'glance.n4':
    `quanto coincidevano gli errori delle copie (1 vuol dire sempre insieme)`,
  'p.kicker':
    `Il problema`,
  'p.h2':
    `Stessa domanda, risposte diverse`,
  'p.p1':
    `Fai la stessa domanda due volte a un modello di IA e puoi ottenere due risposte diverse, anche con la casualità spenta (<span class="mono">temperature=0</span>). Quando Thinking Machines ha posto la stessa domanda a un grande modello 1.000 volte a temperatura 0, ha ottenuto 80 risposte diverse. Tutte iniziavano con gli stessi 102 token (pezzi di parola) e poi prendevano strade diverse <span class="ref">[1]</span>.`,
  'p.p2':
    `Uno studio sui modelli di IA usati come giudici ha trovato lo stesso problema con GPT-4o, Gemini e Claude: stessi input, punteggi diversi, anche a temperatura 0 <span class="ref">[2]</span>.`,
  'p.why':
    `Perché succede, anche con la casualità spenta:`,
  'p.li1':
    `un server affollato elabora la tua richiesta insieme a quelle di altri, e la dimensione di quel gruppo cambia i calcoli (la causa principale trovata in <span class="ref">[1]</span>)`,
  'p.li2':
    `una GPU somma i numeri in ordine diverso, e piccole differenze di arrotondamento si accumulano`,
  'p.li3':
    `una copia più piccola e compressa di un modello è in realtà un modello leggermente diverso`,
  'p.li4':
    `un modello ospitato può essere aggiornato senza preavviso`,
  'p.note':
    `Perché conta: se una risposta può cambiare, non puoi dimostrare cosa ha detto il modello, non puoi confrontare due prompt in modo equo, e una risposta sbagliata può comparire e sparire.`,
  'f.kicker':
    `Primo risultato`,
  'f.h2':
    `Su una sola macchina bastava spegnere la casualità`,
  'f.lead':
    `Prima di costruire qualsiasi cosa, abbiamo misurato. Un piccolo modello aperto (Llama-3.2, 1 miliardo di parametri) su un chip da portatile (Apple M3 Pro), servito da LM Studio:`,
  'f.n1':
    `esecuzioni della stessa richiesta, con quattro seed diversi: una sola risposta`,
  'f.n2':
    `esecuzioni con un’altra richiesta in corso nello stesso momento: identiche a quelle tranquille`,
  'f.note':
    `Quindi sulla tua macchina, con un solo modello, <span class="mono">temperature=0</span> e una semplice cache possono bastare. Le 80 risposte di <span class="ref">[1]</span> venivano da un grande server condiviso, che è dove si trova la maggior parte delle persone quando usa un modello ospitato. Il nostro test di concorrenza sovrapponeva le richieste solo in rete; non riproduceva il raggruppamento di un server affollato.`,
  'b.kicker':
    `Cosa abbiamo costruito comunque`,
  'b.h2':
    `Stabile non vuol dire dimostrabile`,
  'b.lead':
    `Una risposta stabile resta solo un’affermazione. Volevamo altre tre cose: la prova di cosa ha detto il modello, un modo per rieseguirlo e un modo per correggere una risposta sbagliata senza toccare le altre. Questo è DAOS, una libreria Python:`,
  'b.s1':
    `<b class="ink">1. Chiedi una volta.</b> Mandi l’input con uno <em>schema</em>, la forma esatta che la risposta deve avere: campi, valori ammessi, precisione dei numeri. Una risposta che non rispetta lo schema è un errore, mai passata oltre.`,
  'b.s2':
    `<b class="ink">2. Metti in ordine.</b> Due risposte con lo stesso significato devono avere gli stessi byte: un grezzo <span class="mono">0.8500000119</span> diventa <span class="mono ink-2">0.85</span>, il testo viene normalizzato, i campi vengono messi in un ordine fisso.`,
  'b.s3':
    `<b class="ink">3. Firma e salva.</b> La risposta viene firmata, così una modifica si nota, e salvata sotto una chiave che include il file esatto del modello e le sue impostazioni. Cambi il modello e le vecchie risposte non vengono usate.`,
  'b.s4':
    `<b class="ink">4. Riesegui.</b> Con il registro attivo, ogni esecuzione finisce in un registro firmato. Un’esecuzione registrata, rieseguita in un processo nuovo con una nuova chiave di firma, ha restituito gli stessi byte con zero chiamate al modello.`,
  'b.tag':
    `Output reale`,
  'r.kicker':
    `La regola che limita tutto`,
  'r.h2':
    `L’input deve essere esattamente lo stesso`,
  'r.p1':
    `DAOS riconosce una richiesta solo se è identica byte per byte, dopo aver uniformato l’ordine dei campi, la forma unicode e il formato dei numeri. Una maiuscola diversa, uno spazio in più o un refuso nel testo è una richiesta nuova: una nuova chiamata al modello, e forse una risposta diversa.`,
  'r.p2':
    `Potremmo invece abbinare richieste “simili”. Abbiamo scelto di no: decidere cosa sia simile è già un giudizio che può cambiare, e riporterebbe la casualità dalla porta di servizio.`,
  'r.p3':
    `Quindi DAOS va bene per <b class="ink">record che già possiedi e rielabori</b>, come un documento archiviato, un ticket nel tuo database o un set di valutazione. Non va bene per ciò che le persone scrivono.`,
  'r.tag':
    `Esempio`,
  'v.kicker':
    `L’esperimento che non ha dato frutti`,
  'v.h2':
    `Tre copie dello stesso modello che votano`,
  'v.lead':
    `Più copie di un modello possono votare fino a una risposta stabile e anche migliore? Abbiamo eseguito lo stesso modello a piena precisione e compresso a 8-bit e 4-bit, e le abbiamo fatte votare su ogni campo della risposta.`,
  'v.capA':
    `Tre copie votano`,
  'v.capB':
    `1 modello · 3 dimensioni`,
  'v.leaf':
    `Voto sul campo <b>priorità</b>`,
  'v.lone':
    `← l’unica in disaccordo`,
  'v.collapse':
    `vince la maggioranza`,
  'v.subnote':
    `Su 40 campi, la copia a piena precisione non è mai stata l’unica in disaccordo; la copia a 8-bit lo è stata 2 volte; quella a 4-bit, 7 volte.`,
  'v.n1':
    `campi in cui le copie si sono divise due a uno; la maggioranza ha comunque dato una risposta coerente`,
  'v.n2':
    `compiti etichettati usati per misurare l’accuratezza: smistare le richieste dei clienti in 150 intenti`,
  'v.result':
    `Coerente, sì. Migliore, no. Sui 600 compiti il voto ha totalizzato 33.2%; la copia a piena precisione da sola 33.7%. La differenza è troppo piccola per dire chi vince, ma di guadagno non ce n’è. Il motivo: le copie compresse di uno stesso modello fanno gli stessi errori. Due copie entrambe sbagliate davano la stessa risposta sbagliata il 91–99% delle volte, e 380 compiti su 600 erano sbagliati in tutte e tre. Una maggioranza di votanti che sbagliano insieme si limita a ripetere l’errore.`,
  'v.lesson':
    `<b>Coerente non vuol dire corretto.</b> Votare aiuta solo se i votanti sbagliano in modo diverso. Per questo il voto è rimasto una modalità di ricerca e non è mai entrato nel percorso principale della libreria.`,
  'brain.kicker':
    `Idee prese dalle neuroscienze`,
  'ui.notBuilt':
    `Nella specifica`,
  'brain.h2':
    `Anche i cervelli ricavano un pensiero chiaro da parti rumorose`,
  'brain.lead':
    `I neuroni sono rumorosi e inaffidabili, eppure un cervello si ferma su un unico pensiero. La specifica di DAOS prende in prestito tre trucchi che lo rendono possibile e ne rifiuta di proposito un quarto. Nessuno è costruito. Un limite è stato misurato.`,
  'brain.from1':
    `<b>Neuroni che si assestano su uno stato</b> <span class="arrow">→</span> risposte messe in comune`,
  'brain.h3a':
    `Far accordare le copie prima di scegliere ogni parola`,
  'brain.p1':
    `Un gruppo di neuroni che riceve un segnale rumoroso cade in uno schema stabile e, mentre lo fa, ripulisce il rumore. La specifica applica la stessa idea alle copie di un modello: a ogni parola, combina quanto ogni copia considera probabile ogni opzione, sceglie una parola insieme e va avanti al passo di tutte.`,
  'brain.c1':
    `Non costruito. Richiede che ogni copia giri dentro un solo programma, parola per parola, cosa che i server di modelli più diffusi non permettono.`,
  'brain.from2':
    `<b>Molti neuroni che votano</b> <span class="arrow">→</span> un limite al voto`,
  'brain.h3b':
    `Votare aiuta solo se i votanti sbagliano in modo diverso`,
  'brain.p2':
    `Sommare molti neuroni cancella il rumore, ma solo se ognuno sbaglia a caso per conto suo. Se sbagliano insieme, aggiungerne altri non serve. Le copie compresse di uno stesso modello sbagliano insieme, quindi aggiungerne altre smette presto di servire.`,
  'brain.c2':
    `Misurato: le copie sbagliavano insieme quasi sempre (correlazione fino a 0.978). Per questo il voto non ha migliorato l’accuratezza.`,
  'brain.from3':
    `<b>Aspettativa</b> <span class="arrow">→</span> una preferenza dichiarata`,
  'brain.h3c':
    `Sciogliere un quasi-pareggio con una preferenza dichiarata`,
  'brain.p3':
    `Davanti a qualcosa di ambiguo, il cervello si orienta verso ciò che si aspetta. La specifica scioglie allo stesso modo un quasi-pareggio tra due parole: lo schema può indicare quale valore preferire. Di proposito <em>non</em> usa “quello che abbiamo risposto l’ultima volta a qualcosa di simile”, per lo stesso motivo della regola sull’input esatto.`,
  'brain.c3':
    `Non costruito. Senza una preferenza dichiarata, la specifica ricade su una regola fissa.`,
  'brain.from4':
    `Quello che abbiamo scartato: <b>inventare una storia</b>`,
  'brain.h3d':
    `La parte della mente che inventa un motivo`,
  'brain.p4':
    `Gli studi sui pazienti con cervello diviso mostrano la mente che inventa a posteriori una spiegazione convincente e ci crede. È esattamente ciò che DAOS non deve fare: dare sempre la stessa risposta non rende la risposta affidabile.`,
  'brain.tagline':
    `Scartato di proposito: un sistema che inventa la propria certezza è il difetto, non la funzione.`,
  'w.kicker':
    `Le risposte sbagliate si ripetono fedelmente`,
  'w.h2':
    `Così abbiamo aggiunto un controllo e una correzione`,
  'w.lead':
    `Una risposta salvata viene ripetuta con la stessa fedeltà anche quando è sbagliata. Due strumenti se ne occupano.`,
  'w.h3a':
    `Un controllo giornaliero`,
  'w.pa':
    `Una volta al giorno prende le risposte nuove, più una parte a rotazione di quelle vecchie, e chiede a un modello più forte (Claude) e a una ricerca sul web se reggono. Ritira una risposta da solo solo dove lo dicono le tue regole; tutto il resto finisce in un rapporto che una persona deve rivedere. Il controllo è a pagamento, con un tetto di budget che decidi tu.`,
  'w.h3b':
    `Correggere una risposta`,
  'w.pb':
    `Una risposta sbagliata può essere ritirata, o sostituita con una corretta, senza toccare nient’altro. Finché la correzione non c’è, quella richiesta restituisce un errore chiaro invece della risposta sbagliata. Chi l’ha cambiata, e perché, viene registrato insieme alla modifica.`,
  'w.tag':
    `I comandi`,
  'u.kicker':
    `Quando ti serve`,
  'u.h2':
    `Quando vale la pena, e quando no`,
  'u.yes':
    `Ne vale la pena`,
  'u.y1':
    `Rielabori di continuo gli stessi record (documenti, ticket, un catalogo) e devi poter dimostrare o correggere ogni singola risposta.`,
  'u.y2':
    `Usi un modello di IA come giudice, e un punteggio deve cambiare solo se cambia la risposta o il giudice.`,
  'u.y3':
    `Qualcuno potrebbe chiederti, mesi dopo, cosa ha deciso esattamente il modello e se da allora è stato modificato.`,
  'u.no':
    `Non ne vale la pena`,
  'u.n1':
    `Chat, o qualsiasi cosa scritta da persone: la formulazione non è mai identica due volte.`,
  'u.n2':
    `Un solo modello sulla tua macchina, dove <span class="mono">temperature=0</span> e una semplice cache danno già una sola risposta.`,
  'u.n3':
    `Vuoi risposte migliori: DAOS le rende stabili, non giuste.`,
  'u.n4':
    `Usi un modello ospitato: oggi DAOS pilota solo modelli locali, tramite LM Studio.`,
  'o.kicker':
    `Domande aperte`,
  'o.h2':
    `Cosa non abbiamo ancora risolto`,
  'o.h3a':
    `Copie costruite in modo diverso`,
  'o.pa':
    `Copie compresse con metodi diversi (MLX, GPTQ, AWQ) farebbero errori diversi, rendendo il voto utile? Non ancora misurato.`,
  'o.h3b':
    `Accorgersi che un modello è cambiato`,
  'o.pb':
    `La riesecuzione riusa la risposta salvata, quindi un modello che ora risponde in modo diverso viene comunque rieseguito senza problemi. Rilevare questa deriva è progettato, non costruito.`,
  'o.h3c':
    `La stessa risposta su altro software`,
  'o.pc':
    `DAOS promette la stessa risposta per un file di modello con le stesse impostazioni. Passare a un altro software non è coperto; il codice GPU invariante al batch <span class="ref">[1]</span> potrebbe cambiare le cose.`,
  'o.h3d':
    `Agire sui quasi-pareggi`,
  'o.pd':
    `In modalità ricerca DAOS può misurare quando il modello ha quasi scelto un’altra parola. Fare qualcosa al riguardo, per esempio mandare la risposta a revisione, non è costruito.`,
  'close.kicker':
    `Cosa portiamo a casa`,
  'close.h2':
    `Stabile costa poco. Dimostrabile è la parte difficile. Corretto è un altro problema.`,
  'close.lead':
    `Su una sola macchina, spegnere la casualità dà già una sola risposta. Quello che DAOS aggiunge è prova, riesecuzione e correzione risposta per risposta, e solo per input che tornano esattamente uguali. Nessun accordo rende giusta una risposta sbagliata.`,
  's.kicker':
    `Setup e fonti`,
  's.setup':
    `Misurato a luglio 2026 con Llama-3.2-1B-Instruct in tre dimensioni (F16, Q8_0, Q4_K_M), in LM Studio su un Apple M3 Pro. Accuratezza: 600 compiti dal set CLINC150. Progetto: specifica DAOS v1.6. Il repository sorgente è privato.`,
  'footer.guarantee':
    `Una nota di ricerca · specifica v1.6`,
};

const es: DaosDict = {
  'hero.kicker':
    `Una nota de investigación · DAOS`,
  'hero.h1':
    `Preguntar <span class="id">dos veces</span>`,
  'hero.sub':
    `Qué hace falta para obtener la misma respuesta de un modelo de IA.`,
  'hero.lede':
    `Construimos DAOS para que un modelo de IA dé siempre la misma respuesta. Funciona, dentro de límites estrechos. Aquí está lo que medimos, lo que no dio resultado y cuándo no necesitas nada de esto.`,
  'glance.cap':
    `De un vistazo`,
  'glance.n1':
    `ejecuciones de una misma petición con <span class="mono">temperature=0</span>, en una sola máquina: una única respuesta`,
  'glance.n2':
    `llamadas al modelo para repetir una ejecución registrada, byte a byte`,
  'glance.n3':
    `precisión de tres copias del modelo votando, frente a la mejor copia sola (33.7%)`,
  'glance.n4':
    `cuánto coincidían los errores de las copias (1 significa siempre a la vez)`,
  'p.kicker':
    `El problema`,
  'p.h2':
    `La misma pregunta, respuestas distintas`,
  'p.p1':
    `Haz la misma pregunta dos veces a un modelo de IA y puedes recibir dos respuestas distintas, incluso con el azar desactivado (<span class="mono">temperature=0</span>). Cuando Thinking Machines hizo la misma pregunta a un modelo grande 1.000 veces con temperatura 0, obtuvo 80 respuestas distintas. Todas empezaban con los mismos 102 tokens (trozos de palabra) y luego cada una seguía su camino <span class="ref">[1]</span>.`,
  'p.p2':
    `Un estudio sobre modelos de IA usados como evaluadores encontró lo mismo con GPT-4o, Gemini y Claude: entradas idénticas, puntuaciones distintas, incluso con temperatura 0 <span class="ref">[2]</span>.`,
  'p.why':
    `Por qué ocurre, incluso con el azar desactivado:`,
  'p.li1':
    `un servidor ocupado procesa tu petición junto con las de otras personas, y el tamaño de ese lote cambia las cuentas (la causa principal que halló <span class="ref">[1]</span>)`,
  'p.li2':
    `una GPU suma los números en otro orden, y pequeñas diferencias de redondeo se acumulan`,
  'p.li3':
    `una copia más pequeña y comprimida de un modelo es, en realidad, un modelo ligeramente distinto`,
  'p.li4':
    `un modelo alojado puede actualizarse sin aviso`,
  'p.note':
    `Por qué importa: si una respuesta puede cambiar, no puedes demostrar lo que dijo el modelo, no puedes comparar dos prompts con justicia, y una respuesta errónea puede aparecer y desaparecer.`,
  'f.kicker':
    `Primer hallazgo`,
  'f.h2':
    `En una sola máquina, bastaba con quitar el azar`,
  'f.lead':
    `Antes de construir nada, medimos. Un modelo abierto pequeño (Llama-3.2, 1 mil millones de parámetros) en un chip de portátil (Apple M3 Pro), servido con LM Studio:`,
  'f.n1':
    `ejecuciones de la misma petición, con cuatro semillas distintas: una única respuesta`,
  'f.n2':
    `ejecuciones con otra petición en curso a la vez: idénticas a las tranquilas`,
  'f.note':
    `Así que en tu propia máquina, con un solo modelo, <span class="mono">temperature=0</span> y una caché sencilla pueden bastar. Las 80 respuestas de <span class="ref">[1]</span> salieron de un gran servidor compartido, que es donde está la mayoría de la gente cuando usa un modelo alojado. Nuestra prueba de concurrencia solo solapó peticiones en la red; no reprodujo el agrupado de un servidor ocupado.`,
  'b.kicker':
    `Lo que construimos de todos modos`,
  'b.h2':
    `Estable no es lo mismo que demostrable`,
  'b.lead':
    `Una respuesta estable sigue siendo solo una afirmación. Queríamos tres cosas más: una prueba de lo que dijo el modelo, una forma de repetirlo y una forma de corregir una respuesta errónea sin tocar las demás. Eso es DAOS, una biblioteca de Python:`,
  'b.s1':
    `<b class="ink">1. Pregunta una vez.</b> Envías la entrada con un <em>esquema</em>, la forma exacta que debe tener la respuesta: campos, valores permitidos, precisión de los números. Una respuesta que no encaja es un error y nunca se pasa.`,
  'b.s2':
    `<b class="ink">2. Ordena.</b> Dos respuestas que significan lo mismo deben ser los mismos bytes: un <span class="mono">0.8500000119</span> en bruto pasa a ser <span class="mono ink-2">0.85</span>, el texto se normaliza, los campos se colocan en un orden fijo.`,
  'b.s3':
    `<b class="ink">3. Firma y guarda.</b> La respuesta se firma, de modo que una edición se detecta, y se guarda bajo una clave que incluye el archivo exacto del modelo y sus ajustes. Cambias el modelo y las respuestas antiguas no se usan.`,
  'b.s4':
    `<b class="ink">4. Repite.</b> Con el registro activado, cada ejecución queda en un registro firmado. Una ejecución registrada, repetida en un proceso nuevo con otra clave de firma, devolvió los mismos bytes con cero llamadas al modelo.`,
  'b.tag':
    `Salida real`,
  'r.kicker':
    `La regla que lo limita todo`,
  'r.h2':
    `La entrada tiene que ser exactamente la misma`,
  'r.p1':
    `DAOS reconoce una petición solo si es idéntica byte a byte, tras igualar el orden de los campos, la forma unicode y el formato de los números. Una mayúscula distinta, un espacio de más o una errata dentro del texto es una petición nueva: otra llamada al modelo y, quizá, otra respuesta.`,
  'r.p2':
    `Podríamos emparejar peticiones “parecidas”. Decidimos no hacerlo: decidir qué es parecido ya es un juicio que puede cambiar, y traería el azar de vuelta por la puerta de atrás.`,
  'r.p3':
    `Por eso DAOS encaja con <b class="ink">registros que ya tienes y vuelves a procesar</b>, como un documento archivado, un ticket de tu base de datos o un conjunto de evaluación. No encaja con lo que escribe la gente.`,
  'r.tag':
    `Ejemplo`,
  'v.kicker':
    `El experimento que no dio resultado`,
  'v.h2':
    `Tres copias de un modelo, votando`,
  'v.lead':
    `¿Podrían varias copias de un modelo votar hasta una respuesta estable y además mejor? Ejecutamos el mismo modelo a precisión completa y comprimido a 8-bit y 4-bit, y les hicimos votar cada campo de la respuesta.`,
  'v.capA':
    `Tres copias votan`,
  'v.capB':
    `1 modelo · 3 tamaños`,
  'v.leaf':
    `Votación del campo <b>prioridad</b>`,
  'v.lone':
    `← la única en discrepar`,
  'v.collapse':
    `gana la mayoría`,
  'v.subnote':
    `En 40 campos, la copia de precisión completa nunca fue la única en discrepar; la de 8-bit lo fue 2 veces; la de 4-bit, 7 veces.`,
  'v.n1':
    `campos en los que las copias se dividieron dos contra uno; la mayoría dio igualmente una respuesta coherente`,
  'v.n2':
    `tareas etiquetadas para medir la precisión: clasificar peticiones de clientes en 150 intenciones`,
  'v.result':
    `Coherente, sí. Mejor, no. En las 600 tareas la votación sacó 33.2%; la copia de precisión completa sola sacó 33.7%. La diferencia es demasiado pequeña para decantarse, pero no hay mejora. El motivo: las copias comprimidas de un mismo modelo cometen los mismos errores. Dos copias que fallaban daban la misma respuesta errónea el 91–99% de las veces, y 380 de las 600 tareas fallaron en las tres. Una mayoría de votantes que fallan a la vez solo repite el fallo.`,
  'v.lesson':
    `<b>Coherente no es correcto.</b> Votar solo ayuda cuando los votantes cometen errores distintos. Por eso la votación se quedó como modo de investigación y nunca pasó al camino principal de la biblioteca.`,
  'brain.kicker':
    `Ideas tomadas de la neurociencia`,
  'ui.notBuilt':
    `En la especificación`,
  'brain.h2':
    `Los cerebros también sacan un pensamiento claro de piezas ruidosas`,
  'brain.lead':
    `Las neuronas son ruidosas y poco fiables, y aun así un cerebro se queda con un solo pensamiento. La especificación de DAOS toma prestados tres trucos que lo hacen posible y rechaza a propósito un cuarto. Ninguno está construido. Un límite sí se ha medido.`,
  'brain.from1':
    `<b>Neuronas que se asientan en un estado</b> <span class="arrow">→</span> respuestas combinadas`,
  'brain.h3a':
    `Que las copias se pongan de acuerdo antes de elegir cada palabra`,
  'brain.p1':
    `Un grupo de neuronas que recibe una señal ruidosa cae en un patrón estable y, por el camino, limpia el ruido. La especificación aplica la misma idea a las copias de un modelo: en cada palabra, combina lo probable que le parece cada opción a cada copia, elige una palabra entre todas y avanza al unísono.`,
  'brain.c1':
    `No construido. Exige que todas las copias corran dentro de un solo programa, palabra a palabra, algo que los servidores de modelos habituales no permiten.`,
  'brain.from2':
    `<b>Muchas neuronas votando</b> <span class="arrow">→</span> un límite al voto`,
  'brain.h3b':
    `Votar solo ayuda si los votantes cometen errores distintos`,
  'brain.p2':
    `Sumar muchas neuronas cancela el ruido, pero solo cuando cada una comete sus propios errores al azar. Si fallan a la vez, añadir más no sirve. Las copias comprimidas de un mismo modelo fallan a la vez, así que añadir más deja de ayudar enseguida.`,
  'brain.c2':
    `Medido: las copias fallaban a la vez casi siempre (correlación de hasta 0.978). Por eso la votación no mejoró la precisión.`,
  'brain.from3':
    `<b>Expectativa</b> <span class="arrow">→</span> una preferencia declarada`,
  'brain.h3c':
    `Romper un casi empate con una preferencia declarada`,
  'brain.p3':
    `Ante algo ambiguo, el cerebro se inclina hacia lo que espera. La especificación rompe un casi empate entre dos palabras de la misma manera: el esquema puede indicar qué valor preferir. A propósito <em>no</em> usa “lo que respondimos la última vez a algo parecido”, por la misma razón que la regla de la entrada exacta.`,
  'brain.c3':
    `No construido. Sin una preferencia declarada, la especificación recurre a una regla fija.`,
  'brain.from4':
    `La que rechazamos: <b>inventar una historia</b>`,
  'brain.h3d':
    `La parte de la mente que inventa un motivo`,
  'brain.p4':
    `Los estudios con pacientes de cerebro dividido muestran a la mente inventando a posteriori una explicación convincente y creyéndosela. Eso es justo lo que DAOS no debe hacer: dar siempre la misma respuesta no hace fiable la respuesta.`,
  'brain.tagline':
    `Rechazado a propósito: un sistema que se inventa su propia certeza es el fallo, no la función.`,
  'w.kicker':
    `Las respuestas erróneas se repiten con fidelidad`,
  'w.h2':
    `Por eso añadimos una revisión y una corrección`,
  'w.lead':
    `Una respuesta guardada se repite con la misma fidelidad cuando está mal. Dos herramientas se ocupan de ello.`,
  'w.h3a':
    `Una revisión diaria`,
  'w.pa':
    `Una vez al día toma las respuestas nuevas, más una parte rotatoria de las antiguas, y pregunta a un modelo más potente (Claude) y a una búsqueda web si se sostienen. Solo retira una respuesta por sí sola donde tus reglas lo dicen; todo lo demás va a un informe para que lo revise una persona. La revisión es de pago, con un tope de presupuesto que fijas tú.`,
  'w.h3b':
    `Corregir una respuesta`,
  'w.pb':
    `Una respuesta errónea se puede retirar, o sustituir por una corregida, sin tocar nada más. Hasta que haya una corrección, esa petición devuelve un error claro en lugar de la respuesta errónea. Quién la cambió, y por qué, queda registrado junto con el cambio.`,
  'w.tag':
    `Los comandos`,
  'u.kicker':
    `Cuándo lo necesitas`,
  'u.h2':
    `Cuándo merece la pena y cuándo no`,
  'u.yes':
    `Merece la pena`,
  'u.y1':
    `Procesas una y otra vez los mismos registros (documentos, tickets, un catálogo) y debes poder demostrar o corregir cualquier respuesta concreta.`,
  'u.y2':
    `Usas un modelo de IA como evaluador, y una puntuación solo debe moverse si cambia la respuesta o el evaluador.`,
  'u.y3':
    `Alguien puede preguntar, meses después, qué decidió exactamente el modelo y si se ha modificado desde entonces.`,
  'u.no':
    `No merece la pena`,
  'u.n1':
    `Chat, o cualquier cosa que escriba la gente: la redacción nunca es exactamente la misma dos veces.`,
  'u.n2':
    `Un solo modelo en tu propia máquina, donde <span class="mono">temperature=0</span> y una caché sencilla ya dan una única respuesta.`,
  'u.n3':
    `Quieres mejores respuestas: DAOS las hace estables, no acertadas.`,
  'u.n4':
    `Usas un modelo alojado: hoy DAOS solo maneja modelos locales, a través de LM Studio.`,
  'o.kicker':
    `Preguntas abiertas`,
  'o.h2':
    `Lo que aún no hemos respondido`,
  'o.h3a':
    `Copias construidas de otra manera`,
  'o.pa':
    `¿Cometerían errores distintos copias comprimidas con métodos diferentes (MLX, GPTQ, AWQ), y valdría la pena votar? Aún no está medido.`,
  'o.h3b':
    `Darse cuenta de que un modelo ha cambiado`,
  'o.pb':
    `La repetición reutiliza la respuesta guardada, así que un modelo que ahora responde distinto se repite sin problema. Detectar esa deriva está diseñado, no construido.`,
  'o.h3c':
    `La misma respuesta con otro software`,
  'o.pc':
    `DAOS promete la misma respuesta para un archivo de modelo con los mismos ajustes. Pasar a otro software no está cubierto; el código de GPU invariante al lote <span class="ref">[1]</span> podría cambiarlo.`,
  'o.h3d':
    `Actuar ante los casi empates`,
  'o.pd':
    `En modo investigación, DAOS puede medir cuándo el modelo casi eligió otra palabra. Hacer algo al respecto, como enviar la respuesta a revisión, no está construido.`,
  'close.kicker':
    `Lo que nos llevamos`,
  'close.h2':
    `Lo estable sale barato. Lo demostrable es lo difícil. Lo correcto es otro problema.`,
  'close.lead':
    `En una sola máquina, quitar el azar ya da una única respuesta. Lo que añade DAOS es prueba, repetición y corrección respuesta a respuesta, y solo para entradas que vuelven exactamente iguales. Ningún grado de acuerdo convierte una respuesta errónea en correcta.`,
  's.kicker':
    `Configuración y fuentes`,
  's.setup':
    `Medido en julio de 2026 con Llama-3.2-1B-Instruct en tres tamaños (F16, Q8_0, Q4_K_M), en LM Studio sobre un Apple M3 Pro. Precisión: 600 tareas del conjunto CLINC150. Diseño: especificación de DAOS v1.6. El repositorio fuente es privado.`,
  'footer.guarantee':
    `Una nota de investigación · especificación v1.6`,
};

const de: DaosDict = {
  'hero.kicker':
    `Eine Forschungsnotiz · DAOS`,
  'hero.h1':
    `<span class="id">Zweimal</span> fragen`,
  'hero.sub':
    `Was nötig ist, damit ein KI-Modell dieselbe Antwort gibt.`,
  'hero.lede':
    `Wir haben DAOS gebaut, damit ein KI-Modell jedes Mal dieselbe Antwort gibt. Es funktioniert, in engen Grenzen. Hier steht, was wir gemessen haben, was sich nicht gelohnt hat und wann du nichts davon brauchst.`,
  'glance.cap':
    `Auf einen Blick`,
  'glance.n1':
    `Läufe derselben Anfrage mit <span class="mono">temperature=0</span>, auf einer Maschine: genau eine Antwort`,
  'glance.n2':
    `Modellaufrufe, um einen protokollierten Lauf Byte für Byte zu wiederholen`,
  'glance.n3':
    `Genauigkeit von drei abstimmenden Modellkopien, gegen die beste Kopie allein (33.7%)`,
  'glance.n4':
    `wie sehr sich die Fehler der Kopien deckten (1 heißt: immer zusammen)`,
  'p.kicker':
    `Das Problem`,
  'p.h2':
    `Dieselbe Frage, verschiedene Antworten`,
  'p.p1':
    `Stell einem KI-Modell zweimal dieselbe Frage, und du bekommst vielleicht zwei verschiedene Antworten, auch bei abgeschaltetem Zufall (<span class="mono">temperature=0</span>). Als Thinking Machines einem großen Modell dieselbe Frage 1.000-mal bei Temperatur 0 stellte, kamen 80 verschiedene Antworten heraus. Alle begannen mit denselben 102 Tokens (Wortstücken) und gingen dann getrennte Wege <span class="ref">[1]</span>.`,
  'p.p2':
    `Eine Studie zu KI-Modellen als Bewerter fand dasselbe bei GPT-4o, Gemini und Claude: gleiche Eingaben, verschiedene Bewertungen, auch bei Temperatur 0 <span class="ref">[2]</span>.`,
  'p.why':
    `Warum das passiert, auch ohne Zufall:`,
  'p.li1':
    `ein ausgelasteter Server verarbeitet deine Anfrage zusammen mit denen anderer Leute, und die Größe dieser Gruppe ändert die Rechnung (die Hauptursache in <span class="ref">[1]</span>)`,
  'p.li2':
    `eine GPU addiert Zahlen in anderer Reihenfolge, und winzige Rundungsunterschiede summieren sich`,
  'p.li3':
    `eine kleinere, komprimierte Kopie eines Modells ist in Wahrheit ein leicht anderes Modell`,
  'p.li4':
    `ein gehostetes Modell kann ohne Vorwarnung aktualisiert werden`,
  'p.note':
    `Warum das zählt: Wenn sich eine Antwort ändern kann, kannst du nicht belegen, was das Modell gesagt hat, zwei Prompts nicht fair vergleichen, und eine falsche Antwort kann kommen und gehen.`,
  'f.kicker':
    `Erster Befund`,
  'f.h2':
    `Auf einer Maschine reichte es, den Zufall abzuschalten`,
  'f.lead':
    `Bevor wir etwas gebaut haben, haben wir gemessen. Ein kleines offenes Modell (Llama-3.2, 1 Milliarde Parameter) auf einem Laptop-Chip (Apple M3 Pro), bereitgestellt von LM Studio:`,
  'f.n1':
    `Läufe derselben Anfrage, mit vier verschiedenen Seeds: genau eine Antwort`,
  'f.n2':
    `Läufe mit einer zweiten Anfrage gleichzeitig: identisch zu den ruhigen Läufen`,
  'f.note':
    `Auf deiner eigenen Maschine, mit einem Modell, können <span class="mono">temperature=0</span> und ein einfacher Cache also genügen. Die 80 Antworten in <span class="ref">[1]</span> kamen von einem großen, geteilten Server, und dort sind die meisten, wenn sie ein gehostetes Modell nutzen. Unser Test mit parallelen Anfragen überlappte sie nur im Netz; das Bündeln eines ausgelasteten Servers hat er nicht nachgestellt.`,
  'b.kicker':
    `Was wir trotzdem gebaut haben`,
  'b.h2':
    `Stabil heißt nicht nachweisbar`,
  'b.lead':
    `Eine stabile Antwort bleibt nur eine Behauptung. Wir wollten drei weitere Dinge: einen Beleg dafür, was das Modell gesagt hat, eine Möglichkeit, es abzuspielen, und eine Möglichkeit, eine falsche Antwort zu korrigieren, ohne den Rest anzufassen. Das ist DAOS, eine Python-Bibliothek:`,
  'b.s1':
    `<b class="ink">1. Einmal fragen.</b> Du schickst die Eingabe mit einem <em>Schema</em>, der genauen Form, die die Antwort haben muss: Felder, erlaubte Werte, Zahlengenauigkeit. Eine Antwort, die nicht passt, ist ein Fehler und wird nie weitergereicht.`,
  'b.s2':
    `<b class="ink">2. Aufräumen.</b> Zwei Antworten mit gleicher Bedeutung sollen dieselben Bytes sein: ein rohes <span class="mono">0.8500000119</span> wird zu <span class="mono ink-2">0.85</span>, Text wird normalisiert, Felder kommen in feste Reihenfolge.`,
  'b.s3':
    `<b class="ink">3. Signieren und speichern.</b> Die Antwort wird signiert, damit eine Änderung auffällt, und unter einem Schlüssel gespeichert, der die exakte Modelldatei und ihre Einstellungen enthält. Tauschst du das Modell, werden alte Antworten nicht benutzt.`,
  'b.s4':
    `<b class="ink">4. Abspielen.</b> Mit eingeschaltetem Protokoll wird jeder Lauf in einem signierten Protokoll festgehalten. Ein protokollierter Lauf, in einem frischen Prozess mit neuem Signaturschlüssel abgespielt, lieferte dieselben Bytes mit null Modellaufrufen.`,
  'b.tag':
    `Echte Ausgabe`,
  'r.kicker':
    `Die Regel, die alles begrenzt`,
  'r.h2':
    `Die Eingabe muss exakt dieselbe sein`,
  'r.p1':
    `DAOS erkennt eine Anfrage nur, wenn sie Byte für Byte gleich ist, nachdem Feldreihenfolge, Unicode-Form und Zahlenformat vereinheitlicht wurden. Ein anderer Großbuchstabe, ein Leerzeichen zu viel oder ein Tippfehler im Text ist eine neue Anfrage: ein neuer Modellaufruf und womöglich eine andere Antwort.`,
  'r.p2':
    `Wir könnten stattdessen „ähnliche“ Anfragen zuordnen. Wir haben uns dagegen entschieden: Was als ähnlich gilt, ist selbst ein Urteil, das sich ändern kann, und es brächte den Zufall durch die Hintertür zurück.`,
  'r.p3':
    `DAOS passt also zu <b class="ink">Datensätzen, die du schon hast und erneut verarbeitest</b>, etwa einem gespeicherten Dokument, einem Ticket in deiner Datenbank oder einem Testdatensatz. Zu dem, was Menschen eintippen, passt es nicht.`,
  'r.tag':
    `Beispiel`,
  'v.kicker':
    `Das Experiment, das sich nicht gelohnt hat`,
  'v.h2':
    `Drei Kopien eines Modells stimmen ab`,
  'v.lead':
    `Können mehrere Kopien eines Modells sich zu einer Antwort durchstimmen, die stabil und besser ist? Wir haben dasselbe Modell in voller Genauigkeit und auf 8-bit und 4-bit komprimiert laufen lassen und sie über jedes Feld der Antwort abstimmen lassen.`,
  'v.capA':
    `Drei Kopien stimmen ab`,
  'v.capB':
    `1 Modell · 3 Größen`,
  'v.leaf':
    `Abstimmung über das Feld <b>Priorität</b>`,
  'v.lone':
    `← als Einzige anderer Meinung`,
  'v.collapse':
    `die Mehrheit gewinnt`,
  'v.subnote':
    `Bei 40 Feldern war die Kopie in voller Genauigkeit nie die Einzige mit anderer Meinung; die 8-bit-Kopie war es 2-mal; die 4-bit-Kopie 7-mal.`,
  'v.n1':
    `Felder, bei denen sich die Kopien zwei zu eins aufteilten; die Mehrheit gab trotzdem eine einheitliche Antwort`,
  'v.n2':
    `beschriftete Aufgaben zur Messung der Genauigkeit: Kundenanfragen in 150 Absichten sortieren`,
  'v.result':
    `Einheitlich, ja. Besser, nein. Bei den 600 Aufgaben kam die Abstimmung auf 33.2%; die Kopie in voller Genauigkeit allein auf 33.7%. Der Abstand ist zu klein, um ihn zu deuten, aber einen Gewinn gibt es nicht. Der Grund: Komprimierte Kopien eines Modells machen dieselben Fehler. Zwei Kopien, die beide falsch lagen, gaben in 91–99% der Fälle dieselbe falsche Antwort, und bei 380 der 600 Aufgaben lagen alle drei falsch. Eine Mehrheit von Wählern, die gemeinsam scheitern, wiederholt nur den Fehler.`,
  'v.lesson':
    `<b>Einheitlich ist nicht richtig.</b> Abstimmen hilft nur, wenn die Wähler verschiedene Fehler machen. Deshalb blieb die Abstimmung ein Forschungsmodus und kam nie in den Hauptweg der Bibliothek.`,
  'brain.kicker':
    `Ideen aus der Neurowissenschaft`,
  'ui.notBuilt':
    `In der Spezifikation`,
  'brain.h2':
    `Auch Gehirne holen einen klaren Gedanken aus verrauschten Teilen`,
  'brain.lead':
    `Neuronen sind verrauscht und unzuverlässig, und doch legt sich ein Gehirn auf einen Gedanken fest. Die DAOS-Spezifikation übernimmt drei Tricks, die das möglich machen, und lehnt einen vierten bewusst ab. Keiner davon ist gebaut. Eine Grenze wurde gemessen.`,
  'brain.from1':
    `<b>Neuronen, die sich auf einen Zustand einpendeln</b> <span class="arrow">→</span> gebündelte Antworten`,
  'brain.h3a':
    `Die Kopien einigen sich vor jedem Wort`,
  'brain.p1':
    `Eine Gruppe von Neuronen, die ein verrauschtes Signal bekommt, fällt in ein stabiles Muster und räumt dabei das Rauschen auf. Die Spezifikation überträgt das auf Modellkopien: Bei jedem Wort verrechnet sie, für wie wahrscheinlich jede Kopie jede Option hält, wählt gemeinsam ein Wort und geht im Gleichschritt weiter.`,
  'brain.c1':
    `Nicht gebaut. Dafür müssten alle Kopien in einem Programm laufen, Wort für Wort, was gängige Modellserver nicht erlauben.`,
  'brain.from2':
    `<b>Viele abstimmende Neuronen</b> <span class="arrow">→</span> eine Grenze der Abstimmung`,
  'brain.h3b':
    `Abstimmen hilft nur, wenn die Wähler verschiedene Fehler machen`,
  'brain.p2':
    `Viele Neuronen zusammenzuzählen hebt das Rauschen auf, aber nur, wenn jedes seine eigenen zufälligen Fehler macht. Liegen sie gemeinsam daneben, hilft mehr nicht. Komprimierte Kopien eines Modells liegen gemeinsam daneben, also hilft mehr davon schnell nicht mehr.`,
  'brain.c2':
    `Gemessen: Die Kopien lagen fast immer gemeinsam daneben (Korrelation bis 0.978). Deshalb hat die Abstimmung die Genauigkeit nicht verbessert.`,
  'brain.from3':
    `<b>Erwartung</b> <span class="arrow">→</span> eine ausgesprochene Vorliebe`,
  'brain.h3c':
    `Ein knappes Patt mit einer ausgesprochenen Vorliebe lösen`,
  'brain.p3':
    `Bei Mehrdeutigem neigt das Gehirn zu dem, was es erwartet. Die Spezifikation löst ein knappes Patt zwischen zwei Wörtern genauso: Das Schema kann sagen, welcher Wert bevorzugt wird. Bewusst <em>nicht</em> verwendet sie „was wir beim letzten Mal auf etwas Ähnliches geantwortet haben“, aus demselben Grund wie die Regel der exakten Eingabe.`,
  'brain.c3':
    `Nicht gebaut. Ohne ausgesprochene Vorliebe greift die Spezifikation auf eine feste Regel zurück.`,
  'brain.from4':
    `Den haben wir abgelehnt: <b>sich eine Geschichte ausdenken</b>`,
  'brain.h3d':
    `Der Teil des Geistes, der einen Grund erfindet`,
  'brain.p4':
    `Studien an Patienten mit getrenntem Gehirn zeigen, wie der Geist nachträglich eine überzeugende Erklärung erfindet und ihr glaubt. Genau das darf DAOS nicht tun: Jedes Mal dieselbe Antwort zu geben macht die Antwort nicht vertrauenswürdig.`,
  'brain.tagline':
    `Bewusst abgelehnt: Ein System, das sich seine eigene Gewissheit erfindet, ist der Fehler, nicht das Feature.`,
  'w.kicker':
    `Falsche Antworten wiederholen sich treu`,
  'w.h2':
    `Deshalb gibt es eine Prüfung und eine Korrektur`,
  'w.lead':
    `Eine gespeicherte Antwort wird genauso treu wiederholt, wenn sie falsch ist. Zwei Werkzeuge kümmern sich darum.`,
  'w.h3a':
    `Eine tägliche Prüfung`,
  'w.pa':
    `Einmal am Tag nimmt sie die neuen Antworten, dazu einen wechselnden Anteil der älteren, und fragt ein stärkeres Modell (Claude) und eine Websuche, ob sie standhalten. Eine Antwort zieht sie nur dort selbst zurück, wo deine Regeln es sagen; alles andere landet in einem Bericht, den ein Mensch prüft. Die Prüfung kostet Geld und ist durch ein Budget gedeckelt, das du setzt.`,
  'w.h3b':
    `Eine Antwort korrigieren`,
  'w.pb':
    `Eine falsche Antwort lässt sich zurückziehen oder durch eine korrigierte ersetzen, ohne etwas anderes anzufassen. Bis eine Korrektur da ist, liefert diese Anfrage einen klaren Fehler statt der falschen Antwort. Wer es geändert hat und warum, wird mit der Änderung festgehalten.`,
  'w.tag':
    `Die Befehle`,
  'u.kicker':
    `Wann du das brauchst`,
  'u.h2':
    `Wann es sich lohnt und wann nicht`,
  'u.yes':
    `Lohnt sich`,
  'u.y1':
    `Du verarbeitest immer wieder dieselben Datensätze (Dokumente, Tickets, einen Katalog) und musst jede einzelne Antwort belegen oder korrigieren können.`,
  'u.y2':
    `Du nutzt ein KI-Modell als Bewerter, und eine Bewertung soll sich nur ändern, wenn sich die Antwort oder der Bewerter ändert.`,
  'u.y3':
    `Jemand könnte Monate später fragen, was das Modell genau entschieden hat und ob es seitdem geändert wurde.`,
  'u.no':
    `Lohnt sich nicht`,
  'u.n1':
    `Chat, oder alles, was Menschen eintippen: Die Formulierung ist nie zweimal exakt gleich.`,
  'u.n2':
    `Ein Modell auf deiner eigenen Maschine, wo <span class="mono">temperature=0</span> und ein einfacher Cache schon eine Antwort liefern.`,
  'u.n3':
    `Du willst bessere Antworten: DAOS macht sie stabil, nicht richtig.`,
  'u.n4':
    `Du nutzt ein gehostetes Modell: Heute steuert DAOS nur lokale Modelle, über LM Studio.`,
  'o.kicker':
    `Offene Fragen`,
  'o.h2':
    `Was wir noch nicht beantwortet haben`,
  'o.h3a':
    `Anders gebaute Kopien`,
  'o.pa':
    `Würden Kopien, die mit anderen Verfahren komprimiert wurden (MLX, GPTQ, AWQ), andere Fehler machen, sodass sich das Abstimmen lohnt? Noch nicht gemessen.`,
  'o.h3b':
    `Merken, dass sich ein Modell geändert hat`,
  'o.pb':
    `Beim Abspielen wird die gespeicherte Antwort wiederverwendet, also läuft ein Modell, das jetzt anders antwortet, trotzdem sauber durch. Diese Abweichung zu erkennen ist entworfen, nicht gebaut.`,
  'o.h3c':
    `Dieselbe Antwort auf anderer Software`,
  'o.pc':
    `DAOS verspricht dieselbe Antwort für eine Modelldatei mit denselben Einstellungen. Ein Wechsel auf andere Software ist nicht abgedeckt; GPU-Code, der unabhängig von der Batchgröße rechnet <span class="ref">[1]</span>, könnte das ändern.`,
  'o.h3d':
    `Auf knappe Patts reagieren`,
  'o.pd':
    `Im Forschungsmodus kann DAOS messen, wann das Modell fast ein anderes Wort gewählt hätte. Etwas damit zu tun, etwa die Antwort zur Prüfung zu schicken, ist nicht gebaut.`,
  'close.kicker':
    `Was wir mitnehmen`,
  'close.h2':
    `Stabil ist billig. Nachweisbar ist der schwere Teil. Richtig ist ein anderes Problem.`,
  'close.lead':
    `Auf einer Maschine liefert das Abschalten des Zufalls schon eine Antwort. DAOS fügt Beleg, Abspielen und Korrektur pro Antwort hinzu, und nur für Eingaben, die exakt gleich wiederkommen. Keine Einigkeit macht eine falsche Antwort richtig.`,
  's.kicker':
    `Aufbau und Quellen`,
  's.setup':
    `Gemessen im Juli 2026 mit Llama-3.2-1B-Instruct in drei Größen (F16, Q8_0, Q4_K_M), in LM Studio auf einem Apple M3 Pro. Genauigkeit: 600 Aufgaben aus dem Datensatz CLINC150. Entwurf: DAOS-Spezifikation v1.6. Das Quell-Repository ist privat.`,
  'footer.guarantee':
    `Eine Forschungsnotiz · Spezifikation v1.6`,
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
