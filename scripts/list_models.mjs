const apiKey = 'AIzaSyDOoMk3Vd0rw5pKLAwzuIGLapr2h_ts8A0';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function test() {
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
