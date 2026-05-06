import { Karotter } from "../dist/esm/index.js";

const client = new Karotter();

const csrf = await client.auth.getCsrfToken();
console.log("csrfToken:", csrf?.csrfToken?.slice(0, 8) + "...");

try {
  const trending = await client.search.trendingTopics(3);
  console.log("trending topics:", JSON.stringify(trending).slice(0, 200));
} catch (err) {
  console.log("trendingTopics error:", err?.status, err?.message);
}

try {
  const timeline = await client.posts.timeline({ mode: "latest", limit: 3 });
  console.log("timeline posts:", timeline.posts?.length ?? 0);
} catch (err) {
  console.log("timeline error:", err?.status, err?.message);
}

console.log("device id:", client.http.auth.deviceId);
console.log("cookies after csrf:", client.http.auth.cookies);
