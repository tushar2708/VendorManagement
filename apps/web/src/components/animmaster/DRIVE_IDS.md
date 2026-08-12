# Animmaster Google Drive — Component IDs

Root folder: `1BPrOBFEt3pseDZYCK1vwZG3lC_db_DdQ`
Download URL pattern: `https://drive.google.com/uc?export=download&id={FILE_ID}`
Browse URL pattern: `https://drive.google.com/drive/folders/{FOLDER_ID}`

Each subfolder contains numbered variants (1, 2, 3...). Each variant has:
- `code.zip` — the source (HTML/CSS/JS + GSAP)
- `*.mp4` — demo video (skip download)
- `.DS_Store` — skip

## Folder IDs

| Category | Folder ID | Browse URL |
|---|---|---|
| Grid Animations | `1PuGPRYyXDCbcvWmoU_u_cHqUqmu-Z6D5` | [open](https://drive.google.com/drive/folders/1PuGPRYyXDCbcvWmoU_u_cHqUqmu-Z6D5) |
| Hover Effects | `1aSU6qmnYpFFou_38jT9ZfbdzgG_FHrFc` | [open](https://drive.google.com/drive/folders/1aSU6qmnYpFFou_38jT9ZfbdzgG_FHrFc) |
| Navigation Menus | `1Mlgs2HTsYT1fsvPH3icZCCqD5zwENl5s` | [open](https://drive.google.com/drive/folders/1Mlgs2HTsYT1fsvPH3icZCCqD5zwENl5s) |
| Page Transitions | `1BXPcipUdYUIQFkn9ltQRvDi5CQGRH0pj` | [open](https://drive.google.com/drive/folders/1BXPcipUdYUIQFkn9ltQRvDi5CQGRH0pj) |
| Sliders | `1-vfcFPnDQpFWCFUcUTjbsslJBINePb6l` | [open](https://drive.google.com/drive/folders/1-vfcFPnDQpFWCFUcUTjbsslJBINePb6l) |
| SVG Animations | `1tnl5SwbM4DxtvUKgPACUc6C7PnJ214kA` | [open](https://drive.google.com/drive/folders/1tnl5SwbM4DxtvUKgPACUc6C7PnJ214kA) |
| Text Animations | `1D7hbvBrq-mEzYZmHJh3L_-t8JkSkeq1n` | [open](https://drive.google.com/drive/folders/1D7hbvBrq-mEzYZmHJh3L_-t8JkSkeq1n) |

## Not used (skip)

| Category | Folder ID |
|---|---|
| 3D Animation | `1bq6JnS3a9JK_s__kZBqb_efjLZXdlJO4` |
| Background Animations | `1m0eQy5jJYTEpnXk56W-REOEPDybe0GqK` |
| Hero Animations | `1v_LacYesYhfPx1kxu1FQ3aWwPbZpqJAT` |
| Mouse Effects | `1lU_6UJdNz9W1lAUKlPCP4kNUUZhMJl1m` |
| Physics Effects | `1j4ZK7bPnl2p_Lnj7wrIKA_aOLD_wAySX` |
| Scroll Animation | `1VQL20dML4dcCEuj6hjl_yq5JIOLr4sTS` |
| Webgl & ThreeJS Effects | `1Zmha6v9PPaPTpGH_2aYdRiYJGdvyATgI` |

## Verified code.zip File IDs (for direct download)

| Component | Variant | code.zip File ID |
|---|---|---|
| Hover Effects / 1 | Mouse-scale image gallery | `1xYQ7rfDlWlDMbPRpQ1I2tOnjYkl0lQhU` |
| Grid Animations / 1 | Grid layout transition | `1xWS_IrDIeQ8Cf_rnuknC4m7lZkO2V5v5` |
| Text Animations / 1 | Scroll text motion | `1E0wJJsCWiN20pLH2raiYC-wDTFMcGDRr` |

## Tech stack inside each component

- Vanilla HTML/CSS/JS (no React)
- GSAP (GreenSock Animation Platform) — core library
- GSAP plugins: Flip, ScrollTrigger, ScrollSmoother, ScrambleTextPlugin
- Requires conversion to React + `useGSAP` hook from `@gsap/react`

## Download instructions

To download a code.zip:
```bash
curl -sL "https://drive.google.com/uc?export=download&id={FILE_ID}" -o /tmp/{name}.zip
unzip -o /tmp/{name}.zip -d target/path/
```

To find code.zip file ID inside a numbered subfolder:
```bash
curl -sL "https://drive.google.com/drive/folders/{SUBFOLDER_ID}" 2>/dev/null \
  | grep -oP 'data-id="[^"]*"' | grep -v '_gd' | sort -u
# Then download each ID and check with `file` command — the zip is the one that reports "Zip archive"
```
