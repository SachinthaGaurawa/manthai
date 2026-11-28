# The Private Atelier: operations guide

For the Founder and the atelier team. This file is in the repository only; the website never serves it.

## 1. One-time setup (you do this yourself, never in chat)

Set these in **Vercel → Project → Settings → Environment Variables → Production**, then redeploy:

| Variable | What to put | Notes |
| --- | --- | --- |
| `ATELIER_ADMIN_EMAILS` | The Google account(s) allowed in, comma-separated | The email must be verified with Google. |
| `ATELIER_ADMIN_SECRET` | A long phrase you invent (16+ characters) | This is the "Atelier Key" typed at the door. Five wrong tries pause the door for 30 minutes. |
| `SDM_BASE_URL` | The House domain, e.g. `https://www.your-domain.com` | Optional on Vercel (shown in the portal). Required in `.env.local` for the encoder. |

Already set earlier: `VAULT_PEPPER`, `NFC_SDM_MAC_KEY`, `FIREBASE_SERVICE_ACCOUNT`.

Until `ATELIER_ADMIN_EMAILS` and `ATELIER_ADMIN_SECRET` are set, `/admin/atelier` and `/api/atelier/*` answer "page not found" to everyone, including you.

## 2. Opening the Atelier

1. Go to `https://<site>/admin/atelier#enter`. Without `#enter`, the page shows "page not found".
2. Continue with Google using an allowed account.
3. Type the Atelier Key.

The page is not linked anywhere, is not indexed, and holds no secret. The server checks every action again, so a copy of the page is useless to anyone else.

## 3. Daily work

**I · Metal Vault Card Pool.** When a lot of Solid Metal Vault Cards arrives, import its CSV (`archiveSerial,vaultKey`, one card per row). The server keeps only peppered digests. Afterwards, delete the CSV from every computer and inbox.

**II · Pair & Seal Piece.**
1. Choose the garment, size and piece number. The edition line is written for you.
2. Enter the order reference and buyer email. Tick "gift" to keep the recipient private.
3. Concealed Authenticity Seal: tap the chip with a phone and paste the tap URL. A tap URL is preferred because its signature is checked. A UID alone also works.
4. Solid Metal Vault Card: use "Optical Vault Scan" with the camera, or type the serial and key. The card is checked against the pool as you type.
5. Press **Seal & Pair Piece**, then **Print for the Box**.

**III · Archive Ledger.** Search by Passport ID, order, piece, UID or surname. From here you can see every state, lift a 30-minute pause, and do Concierge-Assisted Registration once the House has seen the client, the garment and the card.

Orders are typed by hand for now. Checkout is still a demo, so there is no live order list to pick from yet.

## 4. Two ways the reader is used

The House uses an **ACS ACR1552U** (USB-C). ACR1252U, Identiv uTrust 3700 F and any PC/SC contactless reader also work. The reader has two modes, and each desk uses one of them.

| | Mode 1 · Founder Encoding Station | Mode 2 · Atelier Packing Desk |
| --- | --- | --- |
| Job | Turns factory-blank chips into House seals | Pairs a sealed garment with its Vault Card |
| Reader mode | PC/SC (CCID) | Keyboard Emulation: 7-byte UID, MSB-first, Hex, then Enter |
| Software | Node.js + `scripts/encoder` | Only a browser on `/admin/atelier#enter` |
| Computer | One trusted computer that holds `.env.local` | Any Windows, macOS, Linux computer, or a phone |
| Keys on the computer | NFC_SDM_MAC_KEY (and the master key for production) | None |

**Mode 2 at the packing desk.** Click the seal field in Pair & Seal and tap the garment on the reader. The reader types the UID and presses Enter. The portal tidies the UID and moves to the Vault Card field; Enter never sends the form early. It warns if the reader is set up wrongly:
- *"This UID appears reversed (LSB-first)…"*: switch Keyboard Emulation to MSB-first.
- *"Reader output appears to be Decimal…"*: switch Keyboard Emulation to Hex.

A UID typed by the reader cannot prove the chip was encoded with the House key. Its signature is checked the first time the seal is tapped on a phone. Where possible, tap the garment once with a phone and paste the tap URL instead: that URL is checked when you seal.

Keyboard Emulation and PC/SC are configured with ACS's own setup tool for the ACR1552U. In Keyboard Emulation mode the reader does not appear to the encoder; `npm run doctor` says so.

## 5. Mode 1 · setting up the Founder Encoding Station

Chips are bought **factory-blank** and encoded here. The House SDM key is never sent to a supplier.

### Every computer
1. Install **Node.js 22 LTS** from nodejs.org (20 LTS also works).
2. Get the project onto the computer (git clone or download).
3. Copy `.env.local.example` to `.env.local` at the project root and fill in the three values. It is never committed.

### macOS (Apple Silicon and Intel)
- PC/SC is built in and CCID readers need no driver. Plug the ACR1552U in directly.
- The reader library compiles once during install. It needs Apple's command line tools: `xcode-select --install`.
```
cd scripts/encoder
npm install
npm run doctor
```

### Windows 10 / 11 (PowerShell)
- The ACR1552U works with the built-in Windows CCID driver. Install the official ACS PC/SC driver only if Device Manager shows a warning.
- The Smart Card service must be running:
```
Get-Service SCardSvr
Set-Service SCardSvr -StartupType Automatic   # as administrator, if it is not running
Start-Service SCardSvr
```
- The reader library compiles once during install. It needs **Visual Studio Build Tools** with the "Desktop development with C++" workload, and Python 3 (both free from Microsoft and python.org).
```
cd scripts\encoder
npm install
npm run doctor
```

### Linux (Ubuntu / Debian / Fedora)
```
# Ubuntu / Debian
sudo apt install pcscd libccid libpcsclite-dev build-essential python3
# Fedora
sudo dnf install pcsc-lite pcsc-lite-ccid pcsc-lite-devel gcc-c++ make python3

sudo systemctl enable --now pcscd
cd scripts/encoder
npm install
npm run doctor
```
If the doctor reports "Access denied", run it from the desktop session rather than over SSH, or allow your user in polkit for pcscd.

### Encoding (all systems)

`npm run doctor` checks Node, the smart card service, the readers and `.env.local`. It writes nothing. The reader list marks each slot as `PICC [Selected]` or `SAM [Skipped]`; the ACR1552U and ACR1252U each show a contactless PICC slot and a contact SAM slot, and the SAM slot is never used.

| Command | What it does |
| --- | --- |
| `npm run encode:test` | Test mode. Key 0 stays at the factory value, so the chip can be encoded again. |
| `npm run encode:prod` | Production lock, for chips that go into garments. Key 0 becomes `ATELIER_CHIP_MASTER_KEY` and write access is removed for good. You must type `SEAL`. |
| `npm run encode:test -- --reader "uTrust"` | Picks a reader by part of its name, when more than one is plugged in. |
| `npm run encode:test -- --allow-test-domain` | Allows a vercel.app address, for a throwaway test chip only. |

Safety gates:
- A `vercel.app` or local `SDM_BASE_URL` is refused. `--allow-test-domain` lifts this for test chips, and it never works together with the production lock.
- Each chip is read back like a phone would read it, and its MAC is verified with the House key. Only then does the encoder print `✓ Chip Encoded, Verified & Ready for Stitching — UID: …` together with the tap URL to paste into Pair & Seal.

Recommended first run:
1. Encode 2 or 3 chips with `npm run encode:test -- --allow-test-domain`.
2. Tap them with a phone on the live site.
3. Pair one in the portal, then claim it in the Private Circle.
4. Only then set the House domain and use `npm run encode:prod`.

## 6. The seal byte contract (for engineers)

- URL: `{SDM_BASE_URL}/v?uid=<14 hex>&ctr=<6 hex, most significant byte first>&cmac=<16 hex>`
- File 02 settings:
  - FileOption `40`; AccessRights `E0 EE` (test) or `00 E0` (locked); SDMOptions `C1`
  - SDMAccessRights `FF E2`: CtrRet none, MetaRead plain, FileRead key 2
  - SDMMACInputOffset = SDMMACOffset
- `SV2 = 3CC3 0001 0080 || UID || ctr (least significant byte first)`
- `KSes = CMAC(key 2, SV2)`; `MAC = CMAC(KSes, ∅)`, keeping bytes 1, 3 … 15
- Tests: `node tests/sun.test.mjs`, `node tests/encoder.test.mjs` (NXP AN12196 vectors plus a simulated chip), `node tests/atelier.test.mjs`

The hardware itself has not been tested from the cloud. Run test mode first.
