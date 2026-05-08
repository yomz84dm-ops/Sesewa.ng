const key = "AIzaSyBD68pIwkGk2GzC8gfcUsXOI11fSDo9z_8";
const url1 = `https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-5d01f/databases/ai-studio-60842af9-dc8f-47e0-9c8d-566745e1fa58/documents/handymen`;
const url2 = `https://firestore.googleapis.com/v1/projects/ai-studio-applet-webapp-5d01f/databases/(default)/documents/handymen`;

fetch(url1, { headers: { 'X-Goog-Api-Key': key } }).then(async res => {
  console.log("Enterprise Status:", res.status);
}).catch(console.error);

fetch(url2, { headers: { 'X-Goog-Api-Key': key } }).then(async res => {
  console.log("Default Status:", res.status);
}).catch(console.error);
