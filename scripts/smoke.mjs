import { Karotter } from "../dist/esm/index.js";

const client = new Karotter();

const csrf = await client.auth.csrf();
console.log("csrf token:", csrf.csrfToken.slice(0, 8));

try {
  const trending = await client.search.trendingTopics(3);
  console.log("trending topics:", JSON.stringify(trending).slice(0, 200));
} catch (err) {
  console.log("trendingTopics error:", err?.status, err?.message);
}

try {
  const timeline = await client.timeline.public({ mode: "latest", limit: 3 });
  console.log("public feed posts:", timeline.posts?.length ?? 0);
} catch (err) {
  console.log("public feed error:", err?.status, err?.message);
}

await client.destroy();
