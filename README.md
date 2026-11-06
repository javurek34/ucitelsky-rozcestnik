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

## Zaoblení vnořených prvků

Dodržujte soustředné rohy: vnější rádius = vnitřní rádius + odsazení.
Pro obsahové boxy používáme `--nested-radius: 16px` a `--panel-inset`
(24px, na mobilu 20px). Vnější rádius se počítá pomocí `calc()`;
obrázky uvnitř mají rádius 16px. Dekorativní vrstvy kopírují rádius svého boxu.

Stíny musí být měkké, rozptýlené a tónované do barev webu; nepoužívejte
ostré šedé okraje. Používejte sdílené `--panel-shadow` a `--button-shadow`
s vlastními hodnotami pro světlý a tmavý režim.
