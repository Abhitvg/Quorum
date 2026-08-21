async function run() {
  console.log("1. Logging in...");
  const loginRes = await fetch("http://localhost:3001/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test2@quorum.com", password: "Password123!" })
  });
  
  if (!loginRes.ok) throw new Error("Login failed: " + await loginRes.text());
  
  const cookies = loginRes.headers.get("set-cookie");
  const data = await loginRes.json();
  console.log("Logged in as:", data.user.email);

  console.log("2. Creating a meeting...");
  const createRes = await fetch("http://localhost:3001/meetings", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "cookie": cookies 
    },
    body: JSON.stringify({ title: "Internal Test Meeting" })
  });

  if (!createRes.ok) throw new Error("Create failed: " + await createRes.text());
  const meetingData = await createRes.json();
  console.log("Meeting created:", meetingData.meeting.id, meetingData.meeting.title);
  
  console.log("3. Fetching token...");
  const tokenRes = await fetch(`http://localhost:3001/meetings/${meetingData.meeting.id}/token`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "cookie": cookies 
    }
  });

  if (!tokenRes.ok) throw new Error("Token failed: " + await tokenRes.text());
  const tokenData = await tokenRes.json();
  console.log("Token generated:", tokenData.token ? "YES" : "NO");
  console.log("LiveKit URL:", tokenData.url);

  console.log("SUCCESS! All API endpoints working beautifully.");
}
run().catch(console.error);
