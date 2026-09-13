# Brochmanns gate 14C, 4. etasje, Oslo — FINN ad findings

Source: https://www.finn.no/realestate/homes/ad.html?finnkode=467592160 (FINN-kode 467592160)
Status: **Solgt** (sold) — ad fetched via curl (raw HTML saved) since WebFetch's summarizer risked paraphrasing; all facts below are re-verified against the raw embedded JSON/HTML.
Raw files saved to `plan/raw/`:
- `finn-ad-raw.html` — full raw HTML as served
- `finn-ad-decoded.txt` — unicode/HTML-entity decoded version (easier to grep)
- `image-urls.txt` — 54 gallery image URLs with captions (see below)

Broker: **Notar Gamle Oslo** (notar.no), agent **Julie Marie Lunde** (Daglig leder / Eiendomsmegler / Partner), phone 406 33 638, email julie@notar.no.
Broker page pattern: agent profile at `/meglerprofiler/4740633638` on notar.no.
Prospectus (salgsoppgave):
- `https://notar.no/api/boliger/c3de710c-db1d-4fd2-9919-b1124277f0e2` (view)
- `https://meglervisning.no/salgsoppgave/bestill?instid=MSNO&estateid=c3de710c-db1d-4fd2-9919-b1124277f0e2` (order full PDF)
- `https://meglervisning.no/registrer/MSNO/c3de710c-db1d-4fd2-9919-b1124277f0e2` (register/print-friendly version)
Virtual tour (Matterport 3D scan — very useful for modeling!): **https://my.matterport.com/show/?m=o5P3LBzLZqE**

Housing cooperative (borettslag): "Brockmannsgate borettslag", org.nr 948 318 245, andelsnummer 47.

---

## Ad title
"Herlig og lys 4-roms leilighet med solrik balkong. Bad fra 2025. Fyring og varmtvann ink. Skjermet, grønt og barnevennlig"

## Area figures (Nøkkelinfo panel — verified from raw HTML `data-testid` fields)
- **Boligtype**: Leilighet (apartment)
- **Eieform**: Andel (cooperative share / andelsleilighet)
- **Soverom (bedrooms)**: 3
- **Rom (rooms)**: 4
- **Internt bruksareal (BRA-i)**: 66 m²
- **Bruksareal (total usable area)**: 77 m²
- **Eksternt bruksareal (BRA-e)**: 11 m² — (this is the balcony's external usable area, distinct from TBA below; FINN sometimes counts these separately)
- **Balkong/Terrasse (TBA)**: 7 m²
- **Etasje (floor)**: 4 (of the building; total floor count not explicitly stated in the fetched text)
- **Byggeår (construction year)**: 1948
- **Tomteareal (plot)**: 1,976 m² (eiet — owned, shared by borettslag)
- No per-room (bedroom/living-room/kitchen) individual m² breakdown was found in the ad — only the totals above and the bedroom count of 3. The floor plan image (see gallery, captioned "Plantegning") is the best source for per-room dimensions — **recommend the image be examined directly/OCR'd for room-by-room measurements**, and note the ad says plantegninger are "ikke målbare" (floor plan drawings are not to precise scale).

## Ceiling height (takhøyde)
- **"2,58m takhøyde i stue"** — ceiling height in the living room measured at ca. 2.58 m by the takstmann (surveyor). No other rooms' ceiling heights given; **assume similar (~2.5–2.6m) for other rooms unless stated otherwise — uncertain for bedrooms/bathroom/entrance**.

## Building / facade / construction
Quoted from "Byggemåte" section:
> "Bygningen er en andelsleilighet fra 1948. Fasaden er etterisolert og forblendet med pusset tegl i kombinasjon med pussisolasjon. Etasjeskillene i bygget er konstruert av betongdekke."

Translation: Building from 1948. Facade is retrofitted with added insulation and clad with rendered/plastered brick (pusset tegl) combined with render-insulation system (pussisolasjon). Floor separations (etasjeskiller) are concrete slab (betongdekke).

- Foundation/plot: shared courtyard/garden with fruit trees, small playground, outdoor furniture and grills ("Pent opparbeidet fellesarealer... Uteområdet har frukttrær, en liten lekeplass, utemøbler og griller").
- Location: Bjølsen / Sagene-Torshov district, right by the Akerselva river.

## Windows
Quoted:
> "Vinduer: Bygningen har malte trevinduer med 3-lags glass fra 2026 og et PVC-vindu på baderommet."

Translation: Painted wooden windows with 3-layer (triple) glass installed 2026 throughout the building, and one PVC window in the bathroom.
- Balcony door: "Balkongdøren er i trekarm med 3-lags glass" (wood-framed with triple glass).
- New windows/balcony door installed in 2026 ("Nye vinduer / balkongdør 2026" / "Nye vinduer / balkongdør montert 2026"). This triggered a 25% common-cost increase from 01.05.2026 due to the window project.
- Living room described as having "store vindusflater med dype karmer" (large window surfaces with deep frames/reveals) that let in a lot of daylight.
- Bedroom 3 window has "flott utsikt" (great view).
- Exact window count per room not given.

## Orientation / sun (himmelretning)
- **Balcony is west-facing (vestvendt)** — confirmed multiple times: "Vestvendt balkong", "en vestvendt og romslig balkong på ca. 7m²".
- Sun conditions quote: "Selger opplyser at man på sommeren har solen fra ca. 13:30–17:00 på balkongen før den går bak toppen av treet i hagen. Kommer igjen 18:30/19:00 til 21:30." (Seller states that in summer the sun is on the balcony ca. 13:30–17:00, then blocked by a tree, returning 18:30/19:00–21:30 — i.e. sun visible in the afternoon/evening, consistent with west orientation.)
- Living room ("stue") has large window areas facing the balcony (west side, courtyard-facing).
- View from balcony: "Hyggelig utsikt fra balkongen, den vender mot bakgården" — faces the back courtyard (bakgård), described as sheltered, green, quiet, with little visibility from neighbors ("lite innsyn").

## Balcony
- **Size**: ca. 7 m² (TBA), also referenced as 11 m² BRA-e in nøkkelinfo (external usable area may include a slightly different measurement basis — treat 7 m² as the physical floor area figure quoted repeatedly in text).
- **Orientation**: West-facing.
- **Construction**: "Utgang til balkong fra stuen er utført med et støpt dekke som er forankret til bygningen, med et overliggende tredekke." — Cast concrete deck anchored to the building, with a wood deck on top.
- **Not glassed in** (no mention of "innglasset balkong"; the ad's field for "usableAreaB / Innglasset balkong" was a template label with no populated value for this listing).
- Railing (rekkverk) noted by surveyor as lower than current building code requires (no remediation legally required though).
- Furnishing: room for large seating group and grill; outdoor light and infrared heater present but **not connected to electricity** ("Utelys og infravarmer - ikke tilkoblet strøm").
- Access: directly from the living room ("Fra stuen er det adkomst til...").

## Kitchen (Kjøkken)
Quoted:
> "HTH kjøkkenet fra 2019 har innredning med glatte fronter. Benkeplaten er av støpekompositt med underlimt oppvaskkum. Det er kjøkkenventilator med kullfilter i platetopp."
> "Det er kjøl/fryseskap, oppvaskmaskin, induksjonstopp, kombi micro, stekeovn m/damp, vaskemaskin/tørk, vannstoppsystem og komfyrvakt."

- Brand/installed: **HTH kitchen from 2019**.
- Fronts: smooth/glossy-flat fronts ("glatte fronter").
- Countertop (benkeplate): cast composite ("støpekompositt") with an under-mounted sink ("underlimt oppvaskkum").
- Ventilation: cooker hood with carbon filter integrated in the cooktop ("kjøkkenventilator med kullfilter i platetopp") — i.e., a downdraft/integrated extractor in the induction hob, not a hood above.
- Appliances: fridge/freezer, dishwasher, induction cooktop, combi microwave, oven with steam function, washer/dryer (combo, located in kitchen), water-leak stop system, and stove guard (comfyrvakt).
- Layout: **open kitchen/living room ("åpen stue- og kjøkkenløsning")** — open-plan, kitchen is a "selvfølgelig samlingspunkt" with room for a dining table.
- No island explicitly mentioned — layout described as open plan with dining table space, not an island configuration. **Uncertain whether there's a literal kitchen island; ad doesn't use the word "kjøkkenøy."**

## Living room (Stue)
- Open-plan with kitchen (stue/kjøkken combined) — makes up "hoveddelen av leiligheten."
- Large window areas ("store vindusflater") giving airy, open feel.
- Room for sofa group and coffee table, plus a dining table group.
- Direct access to the west-facing balcony.

## Bathroom (Bad/WC)
Quoted:
> "Flislagt lekkert bad pusset opp i august 2025 av fagfolk. Baderommet har innredning med nedfelt servant, veggmontert toalett og dusjvegger/hjørne. Gulvet er flislagt. Rommet har elektriske varmekabler. Veggene har fliser. Taket er malt. Vindu i våtsone er fuktbestandig. Det er naturlig ventilering med godt avtrekk."

- **Fully renovated August 2025** by professionals ("pusset opp i august 2025 av fagfolk").
- Floor: tiled (flislagt).
- Walls: tiled (fliser).
- Ceiling: painted (malt).
- Fixtures: recessed/built-in sink ("nedfelt servant"), wall-mounted toilet ("veggmontert toalett"), corner shower walls/screen ("dusjvegger/hjørne" — a corner shower enclosure, not a full cabin necessarily).
- Heating: **electric underfloor heating** ("elektriske varmekabler" in the bathroom; also referenced separately as "gulvvarme på bad").
- Window: moisture-resistant PVC window in the wet zone.
- Ventilation: natural, with good extraction ("naturlig ventilering med godt avtrekk") — surveyor flagged as TG2 that it's only natural ventilation (no mechanical extract fan), possibly restricted by borettslag rules.
- No washer/dryer connection mentioned specifically for the bathroom — the washer/dryer combo appears to be located in/near the kitchen per the appliance list.

## Bedrooms (Soverom 1–3) & storage
- **Soverom 1**: "God størrelse" — room for a large double bed + nightstand + wardrobe (garderobeskap). Some neighbors use this room as a TV lounge instead.
- **Soverom 2**: Room for bed + nightstand + wardrobe; suits guest room / children's room / home office.
- **Soverom 3**: Good size, integrated wardrobe ("Integrert gaderobeskap" — likely typo for "garderobeskap"), great view from window; currently furnished as a home office.
- Surveyor noted (TG2) older, worn floor surfaces in the bedrooms ("Eldre bruksslitte overflater på soveromsgulvene").
- Floor levelness: measured height difference 15–30mm across rooms; ±18mm on living room floor, ±10mm on bedroom floor (surveyor TG2 note — floors are not perfectly level, relevant for a realistic 3D model if desired, but likely negligible visually).

## Storage (Bod/Kott)
- Apartment interior includes a **"kott"** (small storage closet inside the unit), per the "Innhold" list: "Entré, bad, stue/kjøkken, soverom, soverom 2, soverom 3 og kott."
- **Kjellerbod** (basement storage room): ca. 5 m², marked "445".
- **Loftsbod** (attic storage room): panelled, ca. 10 m² at floor level under a sloped roof ("Skråtak"), measurable/usable area ca. 6 m², marked "445".
- Total: 2 storage units (as summarized in the ad's bullet highlights: "2 boder").

## Entrance (Entré)
Quoted:
> "Når du åpner inngangsdøren blir du møtt av en lys, romslig og praktisk entré som har god plass til å henge fra seg klær og sette fra seg sko."
- Bright, spacious, practical entrance with room for coats and shoes.
- Fuse box: "Automatsikringer med skap i felles trappegang" — the automatic circuit breaker cabinet is located in the shared stairwell, not inside the apartment.
- Entrance door: painted, smooth fire door ("malt, glatt branndør"), noted by surveyor (TG2) to have wear marks/minor damage ("Bruksmerker/småskader i entredøren").
- Entryway floor tiles noted with some hollow spots/loose tiles ("bom/hullrom i flere entrefliser") per surveyor.

## Doors & lister (trim)
- Balcony door: wood frame, triple glass.
- Entrance door: painted smooth fire door.
- **Interior doors**: "Innvendig har boligen malte fyllingsdører" — painted panel doors (fyllingsdører) throughout the interior.

## Heating (Oppvarming)
Quoted:
> "Leiligheten oppvarmes med radiatorer tilknyttet felles fjernvarme. Det er i tillegg gulvvarme på bad."
- Main heating: **radiators connected to shared district heating (fjernvarme)** via a central heating plant ("Varmesentral: Det er sentralanlegg for varmt vann. Fjernvarmeanlegg med radiatorer.").
- Bathroom: additional **electric underfloor heating** (gulvvarme / varmekabler).
- Heating and hot water costs are included in common costs (felleskostnader): "Fyring og varmtvann inkludert i felleskostnadene."
- Surveyor TG2 note: radiators are older, more than half of expected service life used up ("Eldre radiatorer").

## Ventilation
- Whole apartment: natural ventilation, fresh air via window vents ("Boligen har naturlig ventilasjon. Tilluft via vindusventiler.").
- Kitchen: only a carbon-filter (recirculating) extractor on the cooktop — no forced/mechanical extraction (surveyor TG2 note).
- Bathroom: natural ventilation only, no mechanical extract fan (surveyor TG2 note).

## Surfaces summary ("OVERFLATER" section — as literally stated, flagged as possibly template-mislabeled)
Quoted verbatim:
> "OVERFLATER<br />Vegger: parkett og malte fliser.<br />Gulv: malte plater.<br />Tak: malte flater."

Translated literally: "Walls: parquet and painted tiles. Floor: painted panels/boards. Ceiling: painted surfaces."

**⚠️ UNCERTAIN / LIKELY MISLABELED**: This literal reading (parquet on the *walls*) is almost certainly a template/data-entry error common in Norwegian real-estate listings, where the Vegger/Gulv/Tak fields get filled generically or mixed up — it's inconsistent with parquet flooring being the norm and with the rest of the ad (bedroom/living-room floors are referred to elsewhere as "gulv" with wear, not walls). Cross-reference: the ad's general **facility tags include "Parkett"** (parquet) as a standalone feature tag, confirming parquet flooring exists somewhere in the unit (almost certainly living room/bedrooms, consistent with typical 1948 Oslo apartments and with "malte plater" / "malte flater" reading oddly for a floor). **Recommendation for 3D modeling: use parquet flooring for living room/bedrooms/entrance (standard for this building type/era) and tiled floor for the bathroom (explicitly confirmed elsewhere as "Gulvet er flislagt" in the bathroom). Treat the literal OVERFLATER quote as unreliable/contradictory.**

## Technical installations (Tekniske installasjoner — from Byggemåte/condition section)
- Water pipes: plastic, pipe-in-pipe ("plast (rør i rør)"), inspected in a service shaft (rørskap) in the bathroom cabinetry with 2 shut-off valves.
- Drain pipes: cast iron ("avløpsrør av støpejern").
- Electrical: automatic fuses/circuit breakers with cabinet in the shared stairwell.
- Fire safety: 6kg fire extinguisher (buyer to supply new one), multiple smoke detectors, shared building fire alarm system. Surveyor flagged missing/inadequate smoke detector equipment per current fire-prevention regulations.
- No radon measurement relevant (apartment is 3+ floors above ground level).

## Selected condition report (tilstandsrapport) notes — TG2 (Tilstandsgrad 2) items
- Exterior entrance door: wear marks / minor damage.
- Interior surfaces: older worn bedroom floor surfaces; hollow spots in entrance hall tiles.
- Floor/ceiling separation: floor unevenness of 15–30mm measured across rooms (±18mm living room, ±10mm bedroom).
- Bathroom ventilation: natural only, no mechanical extract.
- Kitchen extraction: carbon filter only, no forced ventilation.
- Waterborne heating (radiators): older units, past half of expected service life.
- Balcony railing height below current code (no forced remediation required).

## Selling points bullet list (from the ad's top summary)
> "- Beliggende i 4.etg.
> - 2,58m takhøyde i stue
> - Vestvendt balkong
> - Nye vinduer / balkongdør 2026
> - Lekkert bad fra 2025
> - HTH kjøkken fra 2019
> - Fyring og varmtvann ink
> - 2 boder
> - Sosial felles hage/bakgård"

## "Innhold" (Contents) — official room list
> "Leiligheten ligger i byggets 4. etasje og inneholder: Entré, bad, stue/kjøkken, soverom, soverom 2, soverom 3 og kott."

So the full room list is: **Entré, Bad, Stue/kjøkken (open plan), Soverom 1, Soverom 2, Soverom 3, Kott** (+ external kjellerbod and loftsbod).

## Location / surroundings (Beliggenhet) — general context, lower priority for 3D model
- Near Akerselva river, Sagene/Bjølsen area, close to shops, cafes (Lille Ó, Meny, Smak av Italia deli), Lilleborg riverside sauna, Villa Paradiso pizzeria, Det Andre Teateret, and a short walk to Nydalen (BI Handelshøyskole, Storosenteret).
- Shared facilities: fellesvaskeri (shared laundry, 2 industrial washers + 1 industrial dryer + drying room), party tent for rent from borettslag (holds 50-60 people).
- Parking: beboerparkering (resident parking) in the area (yearly fee), street parking otherwise.

## Financial (for context, not modeling-relevant)
- Prisantydning: 7,590,000 kr; Totalpris: 7,823,909 kr; Fellesgjeld: 224,413 kr; Felleskost/mnd: 6,146 kr (increasing 25% from 01.05.2026 due to window project); Fellesformue: 46,946 kr; Formuesverdi: 1,636,621 kr.

---

## Image gallery
54 image URLs (full-size 1600w variants) with captions where available saved to `plan/raw/image-urls.txt` (pipe-delimited: `URL | caption`). One image without a caption is the "Plantegning" (floor plan) — captioned explicitly, easy to find by searching for "Plantegning" in that file. A few images have no caption text recovered (marked "(no caption)"); these are likely additional interior/exterior photos or gallery filler images — worth opening manually to check for floor-plan or additional room-detail shots.

## Uncertain / needs follow-up
1. **Per-room area breakdown** — not found in ad text; only totals (66/77/7/11 m²) and bedroom count (3). Need to derive from floor plan image (captioned "Plantegning" in image-urls.txt) — recommend OCR/manual inspection of that image, plus the Matterport 3D tour for real proportions.
2. **OVERFLATER section wording** (walls=parkett) is very likely a mislabeled template field — treated as unreliable (see above), inferred a sensible reading instead.
3. **Ceiling height** only given for living room (2.58m); other rooms assumed similar but not confirmed.
4. **Number of windows per room** and exact window count not stated.
5. **Total number of floors in the building** not explicitly found in fetched text (unit is on the 4th floor).
6. **Whether the kitchen has an island** — ad doesn't use the term; described only as open-plan with dining table space.
7. Full downloadable PDF salgsoppgave was not fetched directly (requires registration via meglervisning.no); the "Om boligen" prospectusView JSON endpoint (`https://notar.no/api/boliger/c3de710c-db1d-4fd2-9919-b1124277f0e2`) may contain more/duplicate data — not separately parsed beyond what's summarized here.
8. The Matterport virtual tour (https://my.matterport.com/show/?m=o5P3LBzLZqE) was not explored (not fetchable via WebFetch/curl in a useful way) — **strongly recommended for whoever builds the 3D model**, as it likely gives real room proportions and finishes visually.
