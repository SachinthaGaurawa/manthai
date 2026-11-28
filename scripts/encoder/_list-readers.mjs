/* prints the PC/SC reader names as JSON, then exits; run in a child process by doctor.mjs
   so that a missing PC/SC service can never hang the doctor itself */
const { NFC } = (await import('nfc-pcsc')).default;
const nfc = new NFC(), names = [], errors = [];
nfc.on('reader', (r) => { r.autoProcessing = false; names.push(r.reader.name); r.on('error', () => {}); });
nfc.on('error', (e) => errors.push(e.message));
setTimeout(() => { process.stdout.write(JSON.stringify({ names, errors })); process.exit(0); }, 2500);
