# Přístup společným heslem

Připravená varianta používá Cloudflare Workers. Každý požadavek na HTML, skript i obrázek nejprve ověří server. Samotná přihlašovací obrazovka v JavaScriptu by veřejný statický web neochránila.

## První nasazení

1. Založte účet na https://dash.cloudflare.com/sign-up .
2. Na počítači s Node.js 22 nebo novějším otevřete tento projekt a spusťte:

```sh
npm ci
npx wrangler login
npm run deploy
npm run setup:password
```

Poslední příkaz se bezpečně zeptá na společné heslo (alespoň 12 znaků) a sám vytvoří náhodný podpisový klíč. Heslo neposílejte do chatu ani ho nevkládejte do repozitáře. Do nastavení Workers se uloží jako tajné hodnoty `SITE_PASSWORD` a `SESSION_SECRET`. Před nastavením tajných hodnot server vrací pouze informaci o nedostupnosti.

3. Na přidělené adrese workers.dev ověřte přihlášení, odhlášení a přímý přístup k obrázku bez přihlášení.
4. Teprve po ověření přesměrujte používané odkazy a vypněte původní veřejný GitHub Pages i původní veřejnou kopii na chatgpt.site. Zkontrolujte také viditelnost repozitáře a podle potřeby jej přepněte na soukromý. Dokud veřejné kopie existují, jejich obsah je nadále dostupný bez hesla.

Nejde o přihlášení Google účtem ani o ověření členství ve skupině zaměstnanců. Přístup má každý, kdo zná společné heslo. Přihlášení používá relační cookie bez trvalého uložení. Po úplném ukončení prohlížeče obvykle skončí; zavření jedné karty či okna nestačí, pokud zůstávají další okna otevřená. Obnova relace prohlížeče může zachovat také přihlášení. Pro jisté ukončení použijte Odhlásit. Server dovolí jedné relaci platit nejvýše sedm dní. Dřívější trvalé relace se po nasazení této změny zneplatní a uživatelé se přihlásí znovu. Změna hesla zneplatní všechna dosavadní přihlášení; použijte znovu `npm run setup:password`. Přístup ke sdíleným dokumentům Google nadále řídí jejich vlastní oprávnění.

## Místní kontrola

Zkopírujte `.dev.vars.example` do `.dev.vars` a nahraďte obě ukázkové hodnoty. Tento soubor je ignorován Gitem. Spusťte `npm run dev:protected`. Běžný Python HTTP server přihlašování neposkytuje.

```sh
npm run build
npm run test:auth
npx wrangler deploy --dry-run
```

Build kopíruje jen soubory webu a povolené obrazové/fontové soubory. Nekopíruje zdroj serveru, dokumentaci ani tajné hodnoty. `run_worker_first: true` musí zůstat zapnuté; jinak by mohly být statické soubory vydávány bez ověření. Přihlášení omezuje počet pokusů podle IP, relace je podepsaná a cookie je Secure/HttpOnly. Chráněné odpovědi se neukládají do cache.
