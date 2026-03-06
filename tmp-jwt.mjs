import { importX509 } from "jose";

async function testFetch() {
  console.log("Fetching certs...");
  const res = await fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys");
  const certs = await res.json();
  const keys = Object.keys(certs);
  console.log("Found kids:", keys);
  
  try {
    const pubKey = await importX509(certs[keys[0]], "RS256");
    console.log("Successfully imported cert to RS256 publicKey:", pubKey);
  } catch (err) {
    console.error("importX509 failed:", err);
  }
}

testFetch();
