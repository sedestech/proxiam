# Bonnes Pratiques de Developpement — Proxiam

Recueil des erreurs rencontrees et correctifs appliques pendant le developpement.
Document vivant, mis a jour a chaque probleme resolu.

---

## 1. MapLibre GL JS v5 + Vite : `__publicField is not defined`

**Sprint** : 2 (Cartographie)
**Date** : 2026-02-20
**Severite** : Critique — les layers GeoJSON ne s'affichent pas du tout

### Symptome

- La carte basemap (CARTO Positron) s'affiche normalement
- `source.setData()` est appele avec des features valides (2723 postes sources)
- Mais `querySourceFeatures()` et `queryRenderedFeatures()` retournent 0
- Les cercles GeoJSON n'apparaissent jamais
- Deux erreurs generiques `Error` dans la console (sans message clair)

### Cause racine

Vite pre-bundle les dependances npm avec **esbuild**. esbuild transforme les class fields ES2022+ en utilisant un helper `__publicField`. Ce helper est injecte en haut du bundle principal.

MapLibre GL JS cree un **Web Worker** via une Blob URL pour traiter les donnees GeoJSON. Le code du worker est extrait du bundle principal, mais le helper `__publicField` n'est PAS inclus dans le blob. Le worker crash silencieusement avec `__publicField is not defined`.

### Diagnostic

```typescript
// Ajouter un listener d'erreur sur la map pour capturer le vrai message :
map.on("error", (e) => {
  console.error("[MapLibre]", e.error?.message || e.error || e);
});
// Revele : "__publicField is not defined"
```

Sans ce listener, les erreurs apparaissent comme `Error` generique (ligne 482 de maplibre-gl.js precompile — c'est le fallback `console.error(t2.error)` du systeme d'evenements MapLibre).

### Correctif

Dans `vite.config.ts`, forcer esbuild a cibler `esnext` pour les dependances pre-bundled :

```typescript
export default defineConfig({
  // ...
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
```

Cela empeche esbuild de transformer les class fields, donc `__publicField` n'est plus injecte et le worker fonctionne.

**Important** : apres ce changement, supprimer le cache Vite :

```bash
rm -rf node_modules/.vite
```

### Alternatives envisagees et rejetees

| Approche | Pourquoi rejetee |
|----------|-----------------|
| Utiliser la build CSP (`maplibre-gl-csp.js` + `setWorkerUrl()`) | Plus complexe, necessite copier le worker dans `public/` |
| `optimizeDeps.exclude: ['maplibre-gl']` | MapLibre est CJS/UMD, Vite ne peut pas le servir sans pre-bundling |
| Downgrade MapLibre v4.x | Regression, v5 a des ameliorations importantes |

---

## 2. React StrictMode + MapLibre : double initialisation

**Sprint** : 2 (Cartographie)
**Date** : 2026-02-20
**Severite** : Haute — la carte ne se charge pas de maniere intermittente

### Symptome

- En mode developpement (React StrictMode), la carte fonctionne de maniere intermittente
- Parfois `map.on("load")` ne fire jamais
- Le fetch de `style.json` (CARTO) echoue avec `net::ERR_ABORTED`

### Cause racine

React 18 StrictMode execute les effets deux fois : `mount -> cleanup -> mount`. Si le cleanup `map.remove()` est appele pendant le premier cycle, il annule la requete HTTP du style en cours. Le second mount cree une nouvelle instance de map, mais le contexte WebGL peut etre corrompu.

### Correctif

Utiliser un **ref guard** (`initRef`) pour ne creer la map qu'une seule fois, et ne PAS retourner de fonction de cleanup :

```typescript
function useMapLibre(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const map = new maplibregl.Map({ /* ... */ });
    mapRef.current = map;

    // PAS de return () => map.remove()
    // La map persiste a travers le cycle StrictMode.
    // Le vrai cleanup se fait quand le composant est demonte (changement de route).
  }, [containerRef]);

  return mapRef;
}
```

### Pourquoi c'est safe

- Le `containerRef` pointe vers le meme element DOM entre les deux mounts (React reutilise le DOM)
- En production (sans StrictMode), l'effet ne s'execute qu'une fois
- Le vrai demontage (navigation) supprime le container du DOM, ce qui declenche le GC de la map

---

## 3. Playwright ne capture pas les `console.log` des callbacks MapLibre

**Sprint** : 2 (Cartographie)
**Date** : 2026-02-20
**Severite** : Faible — probleme de debugging uniquement

### Symptome

Les `console.log()` places dans les callbacks MapLibre (comme `map.on("load", () => { console.log("fired") })`) n'apparaissent PAS dans le listener Playwright `page.on("console")`, meme si le callback s'execute bien.

### Cause

Les callbacks MapLibre s'executent dans un contexte de microtask/callback asynchrone qui peut ne pas etre capture par Playwright si la page est en cours de chargement initial. De plus, les messages du Worker ne sont jamais captures par `page.on("console")`.

### Workaround

- Utiliser `page.evaluate()` apres un `time.sleep()` pour lire l'etat de la map directement
- Exposer temporairement la map avec `(window as any).__proxiamMap = map` pour le debug
- Ajouter `map.on("error", ...)` qui est mieux capture que les logs des workers

---

## 4. PostGIS GeoJSON : format de sortie `ST_AsGeoJSON`

**Sprint** : 2 (Cartographie)
**Date** : 2026-02-20
**Severite** : Moyenne

### Piege

`ST_AsGeoJSON(geom)` retourne une **string JSON**, pas un objet. Il faut parser le resultat :

```python
# INCORRECT
feature["geometry"] = row.geom  # String, pas un dict

# CORRECT
import json
feature["geometry"] = json.loads(db.execute(
    func.ST_AsGeoJSON(PosteSource.geom)
).scalar())
```

Alternativement, utiliser GeoAlchemy2 avec `to_shape()` puis Shapely pour serialiser.

---

## 5. Meilisearch : index vide apres import si documents trop gros

**Sprint** : 1 (Knowledge Engine)
**Date** : 2026-02-19
**Severite** : Moyenne

### Symptome

L'indexation semble reussir (pas d'erreur), mais la recherche retourne 0 resultats.

### Cause

Meilisearch a une limite de taille par document (defaut : aucune, mais le traitement peut etre lent). Le vrai probleme etait que l'import etait asynchrone — le task Meilisearch n'avait pas fini de traiter.

### Correctif

Toujours attendre la fin du task apres un ajout :

```python
task = client.index("items").add_documents(docs)
client.wait_for_task(task.task_uid, timeout_in_ms=30000)
```

---

## 6. Docker + MacOS 8GB RAM : services qui plantent

**Sprint** : 0-2
**Severite** : Haute

### Regle stricte

Sur une machine 8 GB RAM :
- **Max 2-3 containers Docker en parallele** (database + redis suffit)
- **Backend et frontend en mode dev local** (pas en Docker)
- **Ne jamais lancer Playwright + Docker + IDE en meme temps**
- Fermer les services apres les tests : `docker compose down`

### Ordre de demarrage recommande

1. `docker compose up -d database` (PostgreSQL)
2. `docker compose up -d redis` (si necessaire)
3. Backend local : `uvicorn app.main:app --reload`
4. Frontend local : `npm run dev`

---

## 7. Vite HMR : cache stale apres modification de `vite.config.ts`

**Sprint** : 2
**Severite** : Moyenne

### Symptome

Apres avoir modifie `vite.config.ts`, les changements ne prennent pas effet.

### Correctif

Toujours nettoyer le cache et redemarrer :

```bash
rm -rf node_modules/.vite
# Puis redemarrer le serveur Vite
```

Vite pre-bundle les dependances dans `node_modules/.vite/`. Ce cache n'est pas automatiquement invalide quand on modifie `esbuildOptions` ou `optimizeDeps`.

---

## 8. TypeScript : erreurs pre-existantes vs nouvelles

**Sprint** : 1-2
**Severite** : Faible

### Bonne pratique

Avant de modifier un fichier, noter les erreurs TypeScript existantes :

```bash
npx tsc --noEmit 2>&1 | head -20
```

Cela evite de perdre du temps a debugger des erreurs qui existaient deja avant votre modification.

---

## 9. SQLAlchemy ORM + Geometry/UUID : serialisation JSON impossible

**Sprint** : 3 (Scoring)
**Date** : 2026-02-20
**Severite** : Haute — endpoint retourne 500 Internal Server Error

### Symptome

`GET /api/projets` retourne `500 Internal Server Error` des qu'il y a des projets avec des colonnes `Geometry` (PostGIS) et `UUID` en base.

### Cause racine

FastAPI tente de serialiser en JSON les objets SQLAlchemy retournes par `result.scalars().all()`. Les colonnes `Geometry` contiennent du WKB binaire (non serialisable), `UUID` n'est pas serialisable par defaut, et `Decimal` non plus.

### Correctif

Remplacer l'ORM query par du SQL brut avec extraction explicite des coordonnees :

```python
query = text("""
    SELECT id, nom, ST_X(geom) as lon, ST_Y(geom) as lat, ...
    FROM projets WHERE ...
""")
result = await db.execute(query, params)
rows = result.mappings().all()
return [_serialize_projet(dict(r)) for r in rows]
```

La fonction `_serialize_projet()` convertit UUID en `str()`, Decimal en `float()`, et les coordonnees sont deja des floats via `ST_X/ST_Y`.

### Alternative a considerer

Pour une solution plus elegante a long terme : Pydantic `response_model` avec des validators custom pour Geometry et UUID.

---

---

## 10. Service IA avec fallback gracieux (Sprint 5)

**Sprint** : 5 (Agents IA)
**Date** : 2026-02-20
**Severite** : Design — architecture resiliente

### Pattern

Quand un service externe (API Claude) peut ne pas etre disponible (pas de cle, quota, panne), toujours prevoir un fallback utile plutot qu'une erreur.

### Implementation

```python
# Lazy init — ne pas crasher a l'import
_client = None

def _get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.anthropic_api_key:
        return None  # Fallback gracieux
    try:
        import anthropic
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        return _client
    except Exception:
        return None

async def analyze_project(...):
    client = _get_client()
    if not client:
        return _template_analysis(...)  # Fallback template
    try:
        return await _claude_analysis(...)
    except Exception:
        return _template_analysis(...)  # Fallback sur erreur
```

### Points cles

- **Import lazy** : `import anthropic` dans la fonction, pas en haut du fichier — evite un crash si le package n'est pas installe
- **Double fallback** : pas de cle → template, erreur API → template
- **Indicateur source** : champ `source: "claude" | "template"` dans la reponse pour que le frontend affiche le mode
- **Templates metier** : les templates par filiere sont utiles car bases sur la matrice 6D reelle (pas du Lorem ipsum)

---

## 11. Enrichissement de donnees par patterns de noms (Sprint 5)

**Sprint** : 5 (Veille)
**Date** : 2026-02-20
**Severite** : Data — classification automatique

### Probleme

578 sources de veille importees sans type ni frequence. Page Veille inutilisable sans filtres.

### Solution

Script `enrich_sources.py` qui classifie par :
1. Noms connus (RTE → api, ADEME → base_donnees, PV Magazine → rss)
2. Patterns regex (.gouv.fr → base_donnees, API/REST → api, RSS/flux → rss)
3. Default : scraping (le plus courant pour les sources web)

### Points cles

- Verifier l'ordre des regles (les plus specifiques d'abord)
- Toujours avoir un default raisonnable
- Ajouter de la variance dans les frequences (pas tout en "hebdo")
- Resultat : 63 API, 58 BDD, 13 RSS, 444 scraping — distribution realiste

---

## 12. Dark mode : flash de theme incorrect au chargement (Sprint 6)

**Sprint** : 6 (Polish)
**Date** : 2026-02-20
**Severite** : UX — flash visuel desagreable

### Probleme

Si le theme est stocke dans localStorage mais applique apres le premier render React, l'utilisateur voit un flash blanc→sombre (ou inverse).

### Correctif

Appliquer le theme AVANT le premier render :

```typescript
// appStore.ts
function getInitialTheme(): "light" | "dark" | "system" {
  const saved = localStorage.getItem("proxiam-theme");
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

function applyTheme(theme: "light" | "dark" | "system") {
  const isDark = theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("proxiam-theme", theme);
}

// Appliquer immediatement a la creation du store (avant le render)
const initialTheme = getInitialTheme();
applyTheme(initialTheme);
```

### Points cles

- Le store Zustand s'initialise au chargement du module (avant React)
- `applyTheme()` est appele dans le scope module, pas dans un useEffect
- Le listener `matchMedia` met a jour le theme en temps reel si "system" est selectionne

---

## 13. Admin health : noms de champs config differents des noms de service (Sprint 6)

**Sprint** : 6 (Admin)
**Date** : 2026-02-20
**Severite** : Haute — endpoint 500 Internal Server Error

### Symptome

`GET /api/admin/health` retourne 500 : `AttributeError: 'Settings' object has no attribute 'redis_url'`.

### Cause racine

Les noms dans `config.py` ne correspondent pas aux noms "standard" :
- `redis_host` + `redis_port` (pas `redis_url`)
- `meili_host` (pas `meilisearch_url`)
- `meili_master_key` (pas `meilisearch_key`)

### Correctif

Toujours lire `config.py` AVANT d'ecrire du code qui utilise `settings` :

```python
# INCORRECT (noms devines)
redis_url = settings.redis_url
meili_url = settings.meilisearch_url

# CORRECT (noms lus dans config.py)
redis_url = f"redis://{settings.redis_host}:{settings.redis_port}"
meili_url = settings.meili_host
meili_key = settings.meili_master_key
```

### Lecon

Ne jamais deviner les noms de champs de configuration. Toujours verifier le fichier source (config.py, .env.example) avant d'utiliser un champ `settings.xxx`.

---

## Resume des patterns a retenir

| Pattern | Quand l'utiliser |
|---------|-----------------|
| `initRef` guard | Toute librairie imperative dans un `useEffect` (MapLibre, Three.js, D3) |
| `map.on("error", ...)` | Toujours ajouter sur les instances MapLibre pour capturer les erreurs silencieuses |
| `optimizeDeps.esbuildOptions.target: "esnext"` | Quand une lib utilise des Web Workers avec Blob URL dans Vite |
| `rm -rf node_modules/.vite` | Apres tout changement de `vite.config.ts` |
| Pas de cleanup dans useEffect pour les maps | En React StrictMode, la cleanup detruit la map avant qu'elle finisse de charger |
| `page.evaluate()` > `page.on("console")` | Pour debugger l'etat de la map dans Playwright |
| SQL brut + `ST_X/ST_Y` pour les projets | Quand un modele a des colonnes Geometry/UUID que FastAPI ne peut pas serialiser |
| `_serialize_projet()` helper | Centraliser la conversion UUID→str, Decimal→float, Geometry→lon/lat |
| Lazy import + double fallback | Service externe optionnel (API Claude, etc.) : import dans la fonction, fallback si indisponible |
| Enrichissement par patterns | Classifier des donnees en masse par regex/mots-cles plutot que manuellement |
| Theme module-scope init | Appliquer le theme sombre AVANT le premier render React pour eviter le flash |
| Lire config.py avant utilisation | Ne jamais deviner les noms de champs settings — verifier le fichier source |
