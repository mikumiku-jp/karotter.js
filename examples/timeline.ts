import { karotter } from "../src/index.js";

async function main(): Promise<void> {
  const kt = karotter.create();

  const { trends } = await kt.search.trendingTopics(5);
  console.log(`Top ${trends.length} trending topics:`);
  for (const trend of trends) {
    if (
      typeof trend === "object" &&
      trend !== null &&
      "label" in trend &&
      "postCount" in trend
    ) {
      console.log(
        `  ${String(trend.label).padEnd(40)} (${String(trend.postCount)} posts)`,
      );
    }
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
