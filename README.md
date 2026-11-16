# Učitelský rozcestník

Obnoveno z veřejně publikované statické verze webu 26. 10. 2026:
https://ucitelsky-rozcestnik-javor.javurek25644.chatgpt.site

## Chráněná verze

Pro produkční přístup společným heslem je připraven Cloudflare Worker.
Postup nasazení a omezení jsou v [docs/PRISTUP.md](docs/PRISTUP.md).
Příprava kódu sama nezabezpečuje dosavadní veřejné kopie webu.

## Místní statický náhled

V adresáři projektu spusťte:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Statický náhled používá HTML, CSS a JavaScript a nemá ochranu heslem.
Nepotřebuje instalaci balíčků ani build. Chráněná varianta vyžaduje Node.js,
build a nastavení tajných hodnot podle návodu výše. Živé procesy se po obnovení prostředí
musí znovu spustit.

## Ověření

V prohlížeči ověřeno všech 12 karet, návrat na rozcestník, přepnutí
a uchování tmavého režimu, načtení obrázků a šířka mobilního zobrazení.
Bez chyb JavaScriptu. Karty označené jako připravované zůstávají připravované.
Externí Adobe Fonts (use.typekit.net, p.typekit.net) vyžadují povolení sítě;
při nedostupnosti se použije náhradní písmo.

Jde o obnovu publikovaných souborů, ne historie původního editoru nebo chatu.
Soubory nejsou tímto automaticky odeslány na GitHub ani publikovány.

## Zaoblení prvků

Aktuální zadání: karty, obsahové a vnořené boxy i menu používají
`corner-shape: squircle`, s rádiusem 64px pro hlavní obsahové boxy (48px na mobilu)
a 40px pro vnořené boxy (32px na mobilu). Homepage a menu mají 32px. Nahrazuje to předchozí běžné zaoblení 16px/8px.
V prohlížečích bez podpory vykresluje `squircle-fallback.js` skutečné
supereliptické plochy a obrysy; přepočítává je při změně rozměrů a tématu. Vnořené boxy a fotografie odvozují rádius od vnějšího boxu mínus jeho
skutečné odsazení (minimálně 8px). Kruhové ikony a přepínač tématu
zachovávají svůj tvar.
Animovaný světlý obrys homepage sleduje stejnou superelipsu a přepočítává
se při změně rozměrů. Neměňte kvůli tvaru výšku ani šířku boxů.

Stíny musí být měkké, rozptýlené a tónované do barev webu; nepoužívejte
ostré šedé okraje. Používejte sdílené `--panel-shadow` a `--button-shadow`
s vlastními hodnotami pro světlý a tmavý režim.

## Rozestupy a tlačítka

Používejte rozestupy v násobcích 4px (4, 8, 12, 16, 20, 24, 32, 48).
Velikost textu, tloušťka rámečků, optické korekce a plynulé rozměry
v procentech nejsou součástí této stupnice. Automatické mezery vzniklé
zarovnáním obsahu a stejně vysokými boxy se nemusí rovnat násobku 4px.
Akční tlačítka mají minimálně 48px na výšku; ikonové ovladače 44 × 44px.
Delší popisky se mohou zalomit a tlačítko zvětšit. Zachovejte přirozené
prvky `a` pro odkazy a `button` pro akce, viditelný focus, hover a stav
stisknutí. Textové odkazy uvnitř odstavců jsou podtržené.

Kontrola 2026-11-06: oba dodané články UX Planet vracely HTTP 403.
Úpravy vycházejí z čtyřbodového systému a obecných zásad použitelnosti
ovládacích prvků; nejde o potvrzení souladu s nezobrazeným zněním článků.

## Lokální obrázky

Všechny obrázky v HTML, CSS a skriptech jsou nyní uložené v `assets/`.
Externí soubory dodané uživatelem v archivu jsou v `assets/external/`;
jejich původní zdroje eviduje `assets/external/sources.json`.
Logo Školy Online v Úrazech používá lokální soubor z dřívějšího archivu.

`scripts/external-images.json` je prázdný: nezbývají žádné externí obrázky.
Pokud budou přidány nové zdroje, lze je po zpřístupnění domén převést
pomocí `python scripts/localize-images.py`. YouTube přehrávače a Adobe Fonts
jsou externí služby a nejsou součástí místních obrázků.
