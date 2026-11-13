# Učitelský rozcestník

Obnoveno z veřejně publikované statické verze webu 26. 10. 2026:
https://ucitelsky-rozcestnik-javor.javurek25644.chatgpt.site

## Spuštění

V adresáři projektu spusťte:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Projekt používá HTML, CSS a JavaScript. Nepotřebuje instalaci balíčků,
build, databázi ani tajné klíče. Živé procesy se po obnovení prostředí
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

Aktuální zadání: obsahové boxy a karty na úvodu mají rádius 16px,
obrázky a jejich obaly 8px. Tyto explicitní hodnoty nahrazují dřívější
výpočet vnějšího rádiusu z odsazení. Dekorativní vrstvy kopírují rádius boxu.

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

Dodané obrázky jsou uložené v `assets/`. Logo Školy Online v Úrazech
používá stejný lokální soubor jako uzavírání známek.
Zbývající externí obrázky eviduje `scripts/external-images.json`.
Síťová politika prostředí jejich zdroje nyní blokuje. Po povolení domén
lze spustit `python scripts/localize-images.py`: přepíše jen úspěšně
stažené obrázky a obnoví verze zdrojových souborů. Při chybě původní
obrázek neodstraní. YouTube videa a Adobe Fonts tento seznam nezahrnuje.
