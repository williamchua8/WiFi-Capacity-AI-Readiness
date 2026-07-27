# Deploying the Wi-Fi Benchmark on GoHighLevel

## Files

| File | What it is | Where it goes |
|---|---|---|
| `ruijie-wifi-benchmark-SINGLE.html` | Everything in one file, no external dependency | **Start here.** Paste into GHL |
| `ruijie-wifi-benchmark.html` | Page shell that loads the engine from a URL | Use only if you want the engine hosted separately |
| `rj-core.js` | Engine, readable. Keep this, it is the maintainable copy | Your own files |
| `rj-core.min.js` | Engine, obfuscated. Ready to publish | jsDelivr or any static host |

**If in doubt, use the single file.** It has no CDN dependency, no caching problem
and no cross-script binding to go wrong. The split build exists only to keep the
model out of view-source.

---

## Why the earlier attempt failed

Three separate faults, all now fixed:

**1. The HTML was structurally broken.** A `</script>` tag closed after the loader,
so the entire application below it sat in the page as plain text and never ran.
This alone stopped everything.

**2. Obfuscation broke the link between the two files.** The engine used to
publish about forty separate global names, and the page read them by name. An
obfuscator is free to rename anything it likes, so those names stopped matching.
The engine now publishes exactly one object, `window.RJ`, and the page reads
every value off it. Object keys survive obfuscation, so the contract holds.

**3. `verdictText()` was changed to take an argument** but the page still called
it with none, so the verdict paragraph came back empty on the report and in the
PDF. Both call sites now pass the result.

---

## Route A, single file (recommended)

1. **Sites → Funnels → New Funnel → Design**
2. Delete every default section so the canvas is empty
3. Add one **Row → 1 Column**, full width
4. Drag in a **Custom JS/HTML** element
5. Paste the whole of `ruijie-wifi-benchmark-SINGLE.html`
6. **Page Settings → Background Colour → `#03081A`**
7. Set section and row padding to 0

Then add your webhook. Near the top of the first script block:

```js
const GHL_WEBHOOK = "";
```

Paste your Inbound Webhook URL between the quotes.

---

## Route B, split build

GHL media storage rejects `.js`, so host the engine elsewhere. jsDelivr from a
public GitHub repo works, which is what you tried, with two things to get right.

### 1. Publish the engine

Commit `rj-core.min.js` to your repo, then **tag a release**:

```bash
git add rj-core.min.js
git commit -m "engine v2.0"
git tag v2.0
git push origin main --tags
```

### 2. Reference it by tag, not by branch

```html
<script src="https://cdn.jsdelivr.net/gh/williamchua8/WiFi-Capacity-AI-Readiness@v2.0/rj-core.min.js" id="rjCoreScript"></script>
```

**Do not use `@main`.** jsDelivr caches branch references for up to 12 hours, so
after every push you sit waiting, unsure whether you are testing the new file or
the old one. A tag is immutable and cached forever, which is what you want. Bump
the tag when the engine changes.

If you must use `@main` while testing, purge with:
`https://purge.jsdelivr.net/gh/williamchua8/WiFi-Capacity-AI-Readiness@main/rj-core.min.js`

### 3. Keep the script tag exactly as written

The `id="rjCoreScript"` matters. The page listens for that element's load and
error events to know when the engine has arrived.

### 4. Allow list

The engine refuses to run on hosts outside its list. Already included:

```
ebg-campaign.ruijie.com, ruijie.com, ruijienetworks.com,
msgsndr.com, gohighlevel.com, leadconnectorhq.com,
localhost, 127.0.0.1
```

That covers GHL published pages, previews and the builder. Add any other domain
before you test, or you will see the licence message instead of the page.

---

## Re-obfuscating after a model change

Edit `rj-core.js`, never the minified file, then:

```bash
npm install -g javascript-obfuscator

javascript-obfuscator rj-core.js --output rj-core.min.js \
  --compact true \
  --control-flow-flattening true --control-flow-flattening-threshold 0.75 \
  --dead-code-injection true --dead-code-injection-threshold 0.4 \
  --string-array true --string-array-encoding rc4 --string-array-threshold 0.8 \
  --self-defending true \
  --rename-globals false \
  --transform-object-keys false
```

**The last two flags are not optional.** `renameGlobals` would rename the export
object and `transformObjectKeys` would scramble its keys. Either one silently
breaks the page. Everything else can be turned up as far as you like.

Verified: the obfuscated engine produces byte-identical results to the plain one
across the full flow, including the PDF.

---

## Webhook payload

Fires up to four times. Registration fires before any question, so a mid-assessment
drop-off still produces a lead.

| `status` | When |
|---|---|
| `registered` | Details form submitted |
| `completed_questions` | All 6 answered |
| `completed` | Report generated, carries all scores |
| `pdf_downloaded` | PDF exported |

**Contact:** `first`, `last`, `email`, `company`, `role`, `country`, `phone`,
`dial_code`, `phone_local`

**Qualification:** `lead_grade` (A to D), `investment_status`, `review_trigger`,
`sector`, `sector_freetext`, `scale`

**Technical:** `score`, `tier`, `airtime_pct` (capped at 100), `demand_ratio`
(uncapped), `breaking_point`, `wifi_standard`, `app_profile`, `ai_stage`,
`pillar_cap`, `pillar_ai`, `pillar_spec`, `pillar_wire`, `pillar_ops`,
`people_per_ap`, `devices_per_person`, `occupancy`, `wired`, `ops`

**Attribution:** `utm`, `lead_source` (fixed to `WiFi App`), `sm_post`, `ts`

### Suggested workflow

1. Trigger: Inbound Webhook
2. Create or Update Contact
3. Tag `wifi-benchmark`, `sector-{{sector}}`, `grade-{{lead_grade}}`
4. If `status` is `registered` → tag `incomplete`, 24 hour reminder
5. If `status` is `completed` → remove `incomplete`, notify the partner for that country
6. If `lead_grade` is A or B → assign to sales, create an Opportunity

---

## Before launch

- [ ] Webhook URL pasted and tested with a real submission
- [ ] Live domain and preview domain both on the allow list
- [ ] Page background `#03081A`, section and row padding 0
- [ ] Gartner® wording cleared with brand or legal
- [ ] Tested on a phone, both orientations
- [ ] PDF downloads and opens correctly

---

## Troubleshooting

**"The assessment engine did not load"**
The page waited six seconds and gave up. Open the console. Either the script URL
404s, the host is not on the allow list, or jsDelivr is serving a stale file.

**Blank page, no error**
Almost always a broken `<script>` tag. Count them: the single file should have
exactly three opening and three closing tags. If you have edited the HTML, check
you have not closed a script block early.

**White band above or below the content**
GHL section padding. Set section and row padding to 0 and confirm the page
background colour.

**Content not full width**
The page already forces this. If it persists, set the row to Full Width and clear
any max-width on the section.

**Verdict paragraph empty**
You are running an older engine against the new page, or the reverse. Both files
must come from the same build.

**Videos not playing**
Suppressed on mobile by design, and skipped entirely when the browser reports
Save Data or a 3G connection. On desktop, check the CDN URLs still resolve.

**Nothing reaching GHL**
`GHL_WEBHOOK` is still empty, or the workflow trigger is unpublished. With no
webhook set the page logs the payload to the console so you can confirm the shape.

**Analytics errors in the console**
`ERR_BLOCKED_BY_CLIENT` on doubleclick or Google Tag Manager is an ad blocker
blocking GHL's own tracking. Unrelated to this page and harmless.
