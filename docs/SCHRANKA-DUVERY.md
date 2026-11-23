# Schránka důvěry pro učitele

Ve školním rozcestníku je schovaná pod odkazem **ZŠ Kaplického** v patičce a dostupná na adrese
`https://javurek.online/kapli/#schranka-duvery`.

## Spuštění v Cloudflare

Nasazení vytvoří soukromé úložiště SQLite Durable Object `TRUST_INBOX`
a limit požadavků `TRUST_RATE_LIMITER` podle `wrangler.jsonc`.
Není potřeba zakládat další databázi ani kopírovat SQL do administrace.

V **Workers & Pages → ucitelsky-rozcestnik → Settings → Runtime variables
and secrets → Production** přidejte nový **Secret**:

- Název: `TRUST_ADMIN_PASSWORD`
- Hodnota: samostatné silné heslo alespoň 16 znaků, odlišné od hesla rozcestníku.

Potvrďte **Deploy changes / Save and deploy**. Heslo předávejte pouze vedení
školy a určeným členům ŠPP. Nezadávejte ho do zdrojových souborů ani do chatu.
Stávající `SITE_PASSWORD` a `SESSION_SECRET` zůstávají potřeba pro rozcestník.
Dokud chybí úložiště, limit požadavků nebo platné oddělené heslo, formulář
zobrazuje stav přípravy a odesílání je vypnuté. Nezobrazuje falešné potvrzení.

## Jak schránka funguje

Učitel zvolí žádost o radu, podnět k řešení nebo pomoc s konfliktem, popíše
situaci a vybere písemnou komunikaci, společné setkání nebo otevřený postup.
Může požádat o zapojení vedení, ŠPP nebo obou. Tato volba je přáním pro další
postup; přístup k příchozím zprávám má celý pověřený tým. Jméno a kontakt
jsou nepovinné. Tuto informaci vidí odesílatel před odesláním.

Po úspěšném uložení vznikne soukromý kód, který umožňuje čtení pouze jednoho
vlákna a další anonymní komunikaci. Kód se nevkládá do URL ani se automaticky
neukládá do localStorage. Odesílatel si ho musí uschovat. Kdo zná kód, může
číst dané vlákno a psát do něj; jde tedy o přístupové tajemství. Bez kódu
nelze anonymního odesílatele dohledat podle jména. Kód se v databázi uchovává
jako hash. U nových podnětů se navíc uchovává identifikátor pro jeho
opětovné odvození se serverovým tajemstvím: pověřený tým vidí kód v detailu
podnětu, nikoli v seznamu nebo e-mailu správci. Upozornění učiteli na odpověď
naopak obsahuje jeho přístupový kód, pokud uvedl jednu platnou e-mailovou adresu. U starších podnětů bez tohoto
identifikátoru kód zpětně zobrazit nelze. Opakování totožného odeslání po výpadku spojení nevytváří
novou zprávu; při chybě se text ve formuláři zachová.

Pověřený tým zvolí dole **Vstup pro pověřený tým**, přihlásí se odděleným
heslem, vybere zprávu, odpoví a může nastavit stav Nové / V řešení / Uzavřeno.
Zpráva odesílatele po uzavření vlákno znovu otevře. Přístup týmu je společný
pro osoby, kterým správce heslo předá; nejde o individuální Google účty ani
jmenný seznam oprávnění. Při změně pověřeného týmu heslo změňte v Cloudflare.
Změna hesla ruší dřívější relace správy, zachovává však původní vlákna a kódy.

Odpovědi se čtou ve vlákně po vložení kódu. Nový podnět vytvoří upozornění
pro `javurek@zs-kaplickeho.cz`. Neobsahuje text, název, kontakt ani přístupový
kód podnětu, pouze odkaz do schránky. Po nové odpovědi pověřeného týmu přijde učiteli upozornění s jeho
přístupovým kódem a odkazem, bez textu odpovědi. Z kontaktu se použije jen
jedna jednoznačná e-mailová adresa; při chybějícím nebo nejednoznačném kontaktu
se neposílá. U starších podnětů bez obnovitelného kódu se neposílá také.
Další zpráva učitele automatické upozornění správci zatím nevytváří. Pověřený tým musí schránku pravidelně kontrolovat;
aplikace neslibuje konkrétní dobu odpovědi.

### Aktivace e-mailových upozornění (Resend)

1. Založte účet na https://resend.com a v **Domains → Add domain** přidejte
   `javurek.online`. DNS záznamy pro ověření odesílatele vložte podle Resend
   do Cloudflare DNS. Neměňte záznamy školní domény `zs-kaplickeho.cz`.
2. Po ověření domény vytvořte v Resend **API Keys** klíč s oprávněním
   **Sending access**, omezený na tuto doménu.
3. V Cloudflare Workeru přidejte do **Production → Runtime variables and
   secrets** secret `RESEND_API_KEY` a zvolte **Save and deploy**.
   API klíč neposílejte do chatu ani neukládejte do repozitáře.

Odesílatel je `Schránka důvěry <schranka@javurek.online>` (proměnná
`TRUST_NOTIFY_FROM`), příjemce je pevně daný v serverovém kódu. Dokud chybí
API klíč nebo ověření domény, e-maily neodcházejí; podněty se dál ukládají.
Fronta upozornění vzniká ve stejné transakci jako podnět, přežije restart a
při nedostupnosti služby opakuje pokusy s prodlevou až hodinu. Po doplnění
nastavení odešle také čekající upozornění z této verze. Starší podněty
před zavedením fronty upozornění dodatečně neposílají.

Resend dostává adresu příjemce a obecné upozornění. U oznámení učiteli
navíc dostává jeho přístupový kód; text podnětu ani odpovědi se neposílá. Opakované pokusy
používají stejný idempotency key; Resend jej uchovává 24 hodin, takže při
velmi dlouhém nejasném výsledku může vzniknout duplicitní upozornění.
Úspěšné předání službě nezaručuje doručení do doručené pošty; zkontrolujte
Resend → Emails a případně spam. Tato funkce neodesílá text podnětu ani odpovědi ani uživateli neslibuje, že e-mail byl doručen.

## Uložení a ochrana

Obsah, dobrovolný kontakt a odpovědi jsou v soukromém SQLite Durable Object
v účtu Cloudflare. Nejsou statickou součástí webu, repozitáře ani sestavení.
Běžné aktualizace webu úložiště nemažou. Nemažte binding nebo třídu Durable
Object ani nepřidávejte migraci, která by ji rušila, bez zajištění dat.

API vyžaduje přihlášení do školního rozcestníku. Čtení správy navíc kontroluje
na serveru jinou podepsanou HttpOnly/Secure/SameSite cookie, platnou nejvýše
dvě hodiny. Samotné společné heslo rozcestníku k příchozím podnětům přístup
nedává. Odhlášení rozcestníku ruší také cookie správy. Podání i odpovědi mají
omezenou délku, ochranu původu, limit požadavků a vypnutou cache. Obsah se
v prohlížeči vkládá jako text, nikoli jako HTML.

Aplikace k podnětům neukládá IP ani informace o prohlížeči. IP se používá
pouze pro dočasný limit požadavků. To neznamená, že provozovatel infrastruktury
nemůže mít vlastní technické záznamy přístupů. Neslibujte absolutní anonymitu
vůči poskytovateli hostingu nebo správci jeho účtu. Přístupové kódy a obsah
podnětů se z aplikace nevypisují do logů.

Pověřený tým může podnět ve stavu **Uzavřeno** trvale smazat tlačítkem
**Smazat vyřešený podnět**. Před smazáním musí akci potvrdit. Server znovu
ověří stav; znovu otevřený podnět smazat nelze. Smaže se podnět, celá
konverzace a čekající upozornění. Původní přístupový kód přestane fungovat.
Smazání v aplikaci nelze vrátit; případné zálohy poskytovatele mají vlastní
životnost. Již předaný e-mail poskytovateli nelze vzít zpět.

Zprávy se automaticky nemažou podle data. Pravidlo skrývání akcí v Aktuálně
se na schránku nevztahuje. Tato verze nemá přílohy, automatické přeposílání
ani veřejný seznam podnětů.

## Ověření

```sh
npm run build
npm run test:auth
npm run test:trust
npx wrangler deploy --dry-run
```

Pro lokální testování přidejte třetí tajnou hodnotu do ignorovaného souboru
`.dev.vars` a spusťte `npm run dev:protected`. Používejte pouze smyšlené zprávy.
Ověřte zvlášť odesílatele a pověřený tým ve dvou profilech prohlížeče,
přečtení odpovědi přes kód, zákaz vstupu se samotným heslem rozcestníku,
zachování rozepsaného textu při chybě a odhlášení.
