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

## 4. Encoding chips (atelier computer, ACS ACR1252U)

Chips are bought **factory-blank** and encoded here. The House SDM key is never sent to a supplier.

Once:
```
cd scripts/encoder
npm install
cp ../../.env.local.example ../../.env.local   # then fill in the three values
```
On Linux, also install and start `pcscd`. macOS and Windows already have PC/SC.

**Test mode (default).** Key 0 stays at the factory value, so the chip can be encoded again.
```
node encode-ntag424.mjs
```

**Production lock.** For chips that go into garments. Key 0 becomes `ATELIER_CHIP_MASTER_KEY` and write access is removed for good. You must type `SEAL` to confirm.
```
node encode-ntag424.mjs --production-lock
```

Safety gates:
- A `vercel.app` or local `SDM_BASE_URL` is refused. `--allow-test-domain` permits one for a throwaway test chip, and it is never allowed together with `--production-lock`.
- Each chip is read back like a phone and its MAC is verified with the House key. Only then does the encoder print `✓ Chip Encoded, Verified & Ready for Stitching — UID: …` and the tap URL to paste into Pair & Seal.

Recommended first run: encode 2 or 3 chips in test mode with `--allow-test-domain`. Tap them with a phone on the live site, pair one in the portal, then claim it in the Private Circle. Only once that is done, switch to the House domain and `--production-lock`.

## 5. The seal byte contract (for engineers)

- URL: `{SDM_BASE_URL}/v?uid=<14 hex>&ctr=<6 hex, most significant byte first>&cmac=<16 hex>`
- File 02 settings:
  - FileOption `40`; AccessRights `E0 EE` (test) or `00 E0` (locked); SDMOptions `C1`
  - SDMAccessRights `FF E2`: CtrRet none, MetaRead plain, FileRead key 2
  - SDMMACInputOffset = SDMMACOffset
- `SV2 = 3CC3 0001 0080 || UID || ctr (least significant byte first)`
- `KSes = CMAC(key 2, SV2)`; `MAC = CMAC(KSes, ∅)`, keeping bytes 1, 3 … 15
- Tests: `node tests/sun.test.mjs`, `node tests/encoder.test.mjs` (NXP AN12196 vectors plus a simulated chip), `node tests/atelier.test.mjs`

The hardware itself has not been tested from the cloud. Run test mode first.
